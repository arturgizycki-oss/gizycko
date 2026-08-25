import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { contentTypeFor, type StoredObject } from "./storage-types";

/**
 * Files on the local disk. What development uses, and what a VPS could use.
 *
 * Not suitable for a serverless host: the disk there is per-invocation and
 * thrown away, so an uploaded photo would exist for exactly one request.
 */

const ROOT = path.resolve(
  /*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? ".storage",
);

/*
 * These paths point at STORAGE_DIR, which holds what members upload at
 * runtime. The bundler cannot know that, so it assumes a dynamic path might
 * reach project files and traces the whole repository into the build. The
 * markers below tell it not to bother.
 */
/** Reject anything that could climb out of the storage root. */
function resolveKey(key: string): string {
  const normalised = path
    .normalize(key)
    .replace(/^([/\\])+/, "")
    .replace(/\\/g, "/");

  const target = path.resolve(/*turbopackIgnore: true*/ ROOT, normalised);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    throw new Error(`Refusing to touch a path outside storage: ${key}`);
  }
  return target;
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  const target = resolveKey(key);
  await mkdir(/*turbopackIgnore: true*/ path.dirname(target), {
    recursive: true,
  });
  await writeFile(/*turbopackIgnore: true*/ target, data);
}

export async function statObject(key: string): Promise<StoredObject | null> {
  try {
    const info = await stat(/*turbopackIgnore: true*/ resolveKey(key));
    if (!info.isFile()) return null;
    return { size: info.size, contentType: contentTypeFor(key) };
  } catch {
    return null;
  }
}

export async function streamObject(
  key: string,
  range?: { start: number; end: number },
): Promise<ReadableStream<Uint8Array>> {
  const file = createReadStream(
    /*turbopackIgnore: true*/ resolveKey(key),
    range,
  );
  return Readable.toWeb(file) as ReadableStream<Uint8Array>;
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await unlink(/*turbopackIgnore: true*/ resolveKey(key));
  } catch {
    // Already gone; deleting is idempotent on purpose.
  }
}
