import { describe, expect, it } from "vitest";
import { sniffAudio, titleFromFileName } from "@/lib/audio";

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

describe("sniffAudio", () => {
  it("recognises an MP3 with an ID3 tag", () => {
    expect(sniffAudio(bytes("ID3", [3, 0, 0]))?.contentType).toBe("audio/mpeg");
  });

  it("recognises a bare MPEG frame header", () => {
    expect(sniffAudio(bytes([0xff, 0xfb, 0x90, 0x00]))?.contentType).toBe("audio/mpeg");
  });

  it("recognises M4A", () => {
    expect(sniffAudio(bytes([0, 0, 0, 0x20], "ftyp", "M4A "))?.contentType).toBe(
      "audio/mp4",
    );
  });

  it("recognises OGG", () => {
    expect(sniffAudio(bytes("OggS"))?.contentType).toBe("audio/ogg");
  });

  it("recognises FLAC", () => {
    expect(sniffAudio(bytes("fLaC"))?.contentType).toBe("audio/flac");
  });

  it("recognises WAV", () => {
    expect(sniffAudio(bytes("RIFF", [0, 0, 0, 0], "WAVE"))?.contentType).toBe(
      "audio/wav",
    );
  });

  it("rejects a JPEG renamed to .mp3", () => {
    expect(sniffAudio(bytes([0xff, 0xd8, 0xff, 0xe0], "JFIF"))).toBeNull();
  });

  it("rejects an executable", () => {
    expect(sniffAudio(bytes("MZ", [0x90, 0x00]))).toBeNull();
  });

  it("rejects a RIFF container that is not WAVE", () => {
    expect(sniffAudio(bytes("RIFF", [0, 0, 0, 0], "AVI "))).toBeNull();
  });

  it("rejects data too short to identify", () => {
    expect(sniffAudio(Uint8Array.from([0x49, 0x44]))).toBeNull();
  });
});

describe("titleFromFileName", () => {
  it("drops the extension and tidies separators", () => {
    expect(titleFromFileName("my_favourite-song.mp3")).toBe("my favourite song");
  });

  it("copes with a name that has no extension", () => {
    expect(titleFromFileName("demo")).toBe("demo");
  });

  it("caps the length", () => {
    expect(titleFromFileName("a".repeat(400) + ".mp3")).toHaveLength(200);
  });
});
