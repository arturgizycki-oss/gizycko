import { describe, expect, it } from "vitest";
import { sniffVideo } from "@/lib/video";
import { sniffAudio } from "@/lib/audio";

const bytes = (...parts: (number[] | string)[]) => {
  const flat: number[] = [];
  for (const part of parts) {
    if (typeof part === "string") {
      flat.push(...Array.from(part, (c) => c.charCodeAt(0)));
    } else {
      flat.push(...part);
    }
  }
  return Uint8Array.from([...flat, ...new Array(16).fill(0)]);
};

const ftyp = (brand: string) => bytes([0, 0, 0, 0x20], "ftyp", brand);

describe("sniffVideo", () => {
  it("recognises the common MP4 brands", () => {
    for (const brand of ["isom", "mp42", "avc1", "iso2"]) {
      expect(sniffVideo(ftyp(brand))?.contentType).toBe("video/mp4");
    }
  });

  it("recognises QuickTime", () => {
    expect(sniffVideo(ftyp("qt  "))?.contentType).toBe("video/quicktime");
  });

  it("recognises WebM", () => {
    expect(sniffVideo(bytes([0x1a, 0x45, 0xdf, 0xa3]))?.contentType).toBe("video/webm");
  });

  it("rejects an audio-only MP4", () => {
    expect(sniffVideo(ftyp("M4A "))).toBeNull();
  });

  it("rejects a JPEG renamed to .mp4", () => {
    expect(sniffVideo(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBeNull();
  });

  it("rejects data too short to identify", () => {
    expect(sniffVideo(Uint8Array.from([0x1a, 0x45]))).toBeNull();
  });
});

describe("audio and video never claim the same file", () => {
  it("routes an M4A to audio only", () => {
    expect(sniffAudio(ftyp("M4A "))?.contentType).toBe("audio/mp4");
    expect(sniffVideo(ftyp("M4A "))).toBeNull();
  });

  it("routes an MP4 video to video only", () => {
    // Regression: these brands were once accepted as audio, so an uploaded
    // film would have been stored and played back as a song.
    for (const brand of ["isom", "mp42"]) {
      expect(sniffAudio(ftyp(brand))).toBeNull();
      expect(sniffVideo(ftyp(brand))?.contentType).toBe("video/mp4");
    }
  });
});
