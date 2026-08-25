import { randomUUID } from "node:crypto";
import { MEDIA_KINDS, SNIFF_BYTES, type MediaKindName } from "./media-kinds";
import { deleteObject, statObject, streamObject } from "./storage";

/** A key nobody can guess, filed under the kind and the person who sent it. */
export function mintKey(
  kind: MediaKindName,
  userId: string,
  extension: string,
): string {
  return `${MEDIA_KINDS[kind].prefix}/${userId}/${randomUUID()}${extension}`;
}

/** Keys are minted here, so anything else is somebody else's idea. */
export function ownsKey(key: string, kind: MediaKindName, userId: string) {
  return key.startsWith(`${MEDIA_KINDS[kind].prefix}/${userId}/`);
}

export type Verified = {
  key: string;
  size: number;
  contentType: string;
};

/**
 * Confirm that an object the browser uploaded is what it was allowed to be.
 *
 * A signed upload URL says "you may put one object at this key". It says
 * nothing about what was actually put there, so the size and the format are
 * checked here, from the bucket, before anything is written to the database.
 * A file that fails is deleted rather than left sitting in the bucket.
 *
 * The format check reads the first few bytes, the same magic numbers the
 * Server Action path checks, because a filename and a declared content type are
 * both under the uploader's control.
 */
export async function verifyUploaded(
  key: string,
  kind: MediaKindName,
  userId: string,
): Promise<{ ok: true; media: Verified } | { ok: false; error: string }> {
  const spec = MEDIA_KINDS[kind];

  if (!ownsKey(key, kind, userId)) {
    return { ok: false, error: "That upload does not belong to you." };
  }

  const info = await statObject(key);
  if (!info) return { ok: false, error: "That upload did not arrive." };

  if (info.size === 0 || info.size > spec.maxBytes) {
    await deleteObject(key);
    return { ok: false, error: "That file is too large." };
  }

  let head: Uint8Array;
  try {
    const stream = await streamObject(key, { start: 0, end: SNIFF_BYTES - 1 });
    head = new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    await deleteObject(key);
    return { ok: false, error: "That upload could not be read." };
  }

  const format = spec.sniff(head);
  if (!format) {
    await deleteObject(key);
    return { ok: false, error: "That file is not a supported format." };
  }

  // The key carries the extension the signature claimed at signing time; if the
  // bytes disagree, the object is not what was asked for.
  if (!key.toLowerCase().endsWith(format.extension)) {
    await deleteObject(key);
    return { ok: false, error: "That file is not what it claimed to be." };
  }

  return {
    ok: true,
    media: { key, size: info.size, contentType: format.contentType },
  };
}
