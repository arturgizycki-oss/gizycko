import path from "node:path";

/** What `statObject` reports without reading an object's bytes. */
export type StoredObject = { size: number; contentType: string };

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".wav": "audio/wav",
  // Browser recordings: same containers as video, served as audio on purpose.
  ".weba": "audio/webm",
  ".oga": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

/**
 * Content type from the extension we gave the key ourselves.
 *
 * Every key is minted server-side after the bytes were checked by their magic
 * numbers, so the extension is trustworthy in a way an uploaded filename never
 * is.
 */
export function contentTypeFor(key: string): string {
  return (
    CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream"
  );
}
