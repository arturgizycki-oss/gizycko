import * as local from "./storage-local";
import * as supabase from "./storage-supabase";
import { contentTypeFor, type StoredObject } from "./storage-types";

/**
 * Object storage behind a tiny interface.
 *
 * STORAGE_DRIVER picks where bytes live: the local disk in development, a
 * Supabase bucket in production. Nothing outside this file knows which.
 */

const driver = process.env.STORAGE_DRIVER === "supabase" ? supabase : local;

/** Whether uploads can be signed and sent straight from the browser. */
export const SUPPORTS_DIRECT_UPLOAD = process.env.STORAGE_DRIVER === "supabase";

export function putObject(key: string, data: Buffer): Promise<void> {
  return driver.putObject(key, data);
}

/** Size and type of a stored object, without reading its bytes. */
export function statObject(key: string): Promise<StoredObject | null> {
  return driver.statObject(key);
}

/**
 * A stored object as a stream, optionally a byte range of it.
 *
 * Reading the whole file to answer a range request means a 30 MB video costs
 * 30 MB of memory every time somebody drags the scrub bar. A stream costs a
 * buffer.
 */
export function streamObject(
  key: string,
  range?: { start: number; end: number },
): Promise<ReadableStream<Uint8Array>> {
  return driver.streamObject(key, range);
}

export function deleteObject(key: string): Promise<void> {
  return driver.deleteObject(key);
}

/**
 * Permission for the browser to upload one object itself.
 *
 * Only the Supabase driver can do this; on local disk the caller falls back to
 * sending the bytes through a Server Action.
 */
export function signedUploadUrl(key: string) {
  if (!SUPPORTS_DIRECT_UPLOAD) {
    throw new Error("The local storage driver cannot sign uploads");
  }
  return supabase.signedUploadUrl(key);
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

export { contentTypeFor };
export type { StoredObject };
