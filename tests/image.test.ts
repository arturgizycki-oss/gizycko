import { describe, expect, it } from "vitest";
import { sniffImage } from "@/lib/image";

const pad = (header: number[]) =>
  Uint8Array.from([...header, ...new Array(16).fill(0)]);

describe("sniffImage", () => {
  it("recognises JPEG", () => {
    expect(sniffImage(pad([0xff, 0xd8, 0xff, 0xe0]))?.contentType).toBe("image/jpeg");
  });

  it("recognises PNG", () => {
    expect(
      sniffImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.contentType,
    ).toBe("image/png");
  });

  it("recognises WebP", () => {
    const bytes = pad([
      ...[0x52, 0x49, 0x46, 0x46], // RIFF
      ...[0, 0, 0, 0],
      ...[0x57, 0x45, 0x42, 0x50], // WEBP
    ]);
    expect(sniffImage(bytes)?.contentType).toBe("image/webp");
  });

  it("rejects a text file renamed to .jpg", () => {
    expect(sniffImage(new TextEncoder().encode("not an image at all"))).toBeNull();
  });

  it("rejects an SVG, which can carry script", () => {
    expect(sniffImage(new TextEncoder().encode("<svg xmlns='...'></svg>"))).toBeNull();
  });

  it("rejects data too short to identify", () => {
    expect(sniffImage(Uint8Array.from([0xff, 0xd8]))).toBeNull();
  });
});
