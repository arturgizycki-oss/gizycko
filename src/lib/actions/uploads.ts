"use server";

import { requireSession } from "@/lib/session";
import { isMediaKind, MEDIA_KINDS, type MediaKindName } from "@/lib/media-kinds";
import { mintKey } from "@/lib/uploads";
import { signedUploadUrl, SUPPORTS_DIRECT_UPLOAD } from "@/lib/storage";

export type SignedUpload =
  | { ok: true; key: string; url: string; token: string }
  | { ok: false; error: string };

/**
 * Permission for the browser to put one file straight into the bucket.
 *
 * A serverless request body is capped at a few megabytes, well under what a
 * video post is allowed to be, so the bytes cannot travel through a Server
 * Action. This hands out a signed URL for a key the server chose instead.
 *
 * Signing is not trust. The key is namespaced to the signed-in member, the size
 * is checked before signing and again afterwards, and whatever lands there has
 * its magic bytes read before it is attached to anything. See verifyUploaded.
 */
export async function signUpload(
  kind: MediaKindName | string,
  extension: string,
  size: number,
): Promise<SignedUpload> {
  const session = await requireSession();

  if (!SUPPORTS_DIRECT_UPLOAD) {
    return { ok: false, error: "Direct upload is not configured." };
  }

  if (!isMediaKind(kind)) {
    return { ok: false, error: "Unknown upload type." };
  }

  const spec = MEDIA_KINDS[kind];
  const wanted = extension.toLowerCase();

  if (!spec.extensions.includes(wanted)) {
    return { ok: false, error: "That file type is not allowed here." };
  }

  if (!Number.isFinite(size) || size <= 0 || size > spec.maxBytes) {
    const mb = Math.round(spec.maxBytes / 1024 / 1024);
    return { ok: false, error: `That file is over the ${mb} MB limit.` };
  }

  const key = mintKey(kind, session.user.id, wanted);

  try {
    const signed = await signedUploadUrl(key);
    return { ok: true, key, url: signed.url, token: signed.token };
  } catch {
    return { ok: false, error: "Could not start the upload." };
  }
}
