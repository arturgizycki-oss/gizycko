export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PROFILE_PHOTOS = 6;

type ImageKind = { extension: string; contentType: string };

/**
 * Identify an image by its magic bytes rather than trusting the filename or the
 * browser-supplied content type, both of which an uploader controls.
 */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: ".jpg", contentType: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, index) => bytes[index] === byte)) {
    return { extension: ".png", contentType: "image/png" };
  }

  // WEBP: "RIFF" .... "WEBP"
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return { extension: ".webp", contentType: "image/webp" };
  }

  // GIF: "GIF87a" or "GIF89a"
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") {
    return { extension: ".gif", contentType: "image/gif" };
  }

  return null;
}

export type ImageCheck =
  { ok: true; kind: ImageKind; bytes: Buffer } | { ok: false; error: string };

export async function checkUploadedImage(file: File): Promise<ImageCheck> {
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Images must be 5 MB or smaller." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) {
    return {
      ok: false,
      error: "Only JPEG, PNG, WebP, and GIF images are allowed.",
    };
  }

  return { ok: true, kind, bytes };
}
