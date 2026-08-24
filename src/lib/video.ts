export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

export type VideoKind = { extension: string; contentType: string };

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/** MP4 brands that mean video. M4A/M4B are audio and belong to sniffAudio. */
const VIDEO_BRANDS = ["isom", "iso2", "mp41", "mp42", "avc1", "dash", "MSNV", "M4V "];

/**
 * Identify a video by its magic bytes, never by filename or the content type
 * the browser claims.
 */
export function sniffVideo(bytes: Uint8Array): VideoKind | null {
  if (bytes.length < 12) return null;

  // MP4 / MOV share the "ftyp" box at offset 4; the brand separates them.
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "qt  ") {
      return { extension: ".mov", contentType: "video/quicktime" };
    }
    if (VIDEO_BRANDS.includes(brand)) {
      return { extension: ".mp4", contentType: "video/mp4" };
    }
    return null;
  }

  // WebM / Matroska: EBML header.
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return { extension: ".webm", contentType: "video/webm" };
  }

  return null;
}

export type VideoCheck =
  | { ok: true; kind: VideoKind; bytes: Buffer }
  | { ok: false; error: string };

export async function checkUploadedVideo(file: File): Promise<VideoCheck> {
  if (file.size === 0) return { ok: false, error: "That video file is empty." };
  if (file.size > MAX_VIDEO_BYTES) {
    return { ok: false, error: "Videos must be 30 MB or smaller." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffVideo(bytes);
  if (!kind) {
    return { ok: false, error: "Only MP4, WebM, and MOV videos are allowed." };
  }

  return { ok: true, kind, bytes };
}
