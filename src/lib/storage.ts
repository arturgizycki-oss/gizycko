import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Object storage behind a tiny interface.
 *
 * The local driver writes under STORAGE_DIR and is what dev uses. Production on
 * a serverless host needs a real bucket: implement putObject/getObject/
 * deleteObject against S3, R2, or Supabase Storage and switch on STORAGE_DRIVER.
 * Nothing outside this file knows where bytes live.
 */

const STORAGE_ROOT = path.resolve(process.env.STORAGE_DIR ?? ".storage");

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

/** Reject anything that could climb out of the storage root. */
function resolveKey(key: string): string {
  const normalised = path
    .normalize(key)
    .replace(/^([/\\])+/, "")
    .replace(/\\/g, "/");

  const target = path.resolve(STORAGE_ROOT, normalised);
  if (target !== STORAGE_ROOT && !target.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error(`Refusing to touch a path outside storage: ${key}`);
  }
  return target;
}

export function contentTypeFor(key: string): string {
  return CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  const target = resolveKey(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function getObject(
  key: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  try {
    const data = await readFile(resolveKey(key));
    return { data, contentType: contentTypeFor(key) };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await unlink(resolveKey(key));
  } catch {
    // Already gone; deleting is idempotent on purpose.
  }
}

/** Public URL for a stored object. Photo.url in the database holds this. */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}

/** Turn a stored URL back into its key. */
export function keyFromMediaUrl(url: string): string | null {
  const prefix = "/api/media/";
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
