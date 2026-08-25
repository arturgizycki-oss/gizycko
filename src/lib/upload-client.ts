"use client";

import { signUpload } from "./actions/uploads";
import type { MediaKindName } from "./media-kinds";

/** Extension for a file, taken from its name and checked against its type. */
function extensionOf(file: File): string {
  const fromName = /\.[a-z0-9]{2,5}$/i.exec(file.name)?.[0]?.toLowerCase();
  if (fromName) return fromName;

  // A recording made in the browser has no filename to read.
  const fromType: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "audio/webm": ".weba",
    "audio/ogg": ".oga",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };

  return fromType[file.type.split(";")[0].toLowerCase()] ?? "";
}

export type UploadResult =
  { ok: true; key: string } | { ok: false; error: string };

/**
 * Send one file straight to the bucket and return the key it landed under.
 *
 * The server signs a key, the browser puts the bytes there, and the key is what
 * the form submits. Nothing large passes through the application, which is what
 * makes a thirty-megabyte video possible on a host that caps request bodies at
 * four and a half.
 */
export async function uploadDirect(
  file: File,
  kind: MediaKindName,
): Promise<UploadResult> {
  const extension = extensionOf(file);
  if (!extension) return { ok: false, error: "Unrecognised file type." };

  const signed = await signUpload(kind, extension, file.size);
  if (!signed.ok) return { ok: false, error: signed.error };

  try {
    const response = await fetch(signed.url, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${signed.token}`,
        "content-type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      return { ok: false, error: "The upload did not finish." };
    }
  } catch {
    return { ok: false, error: "The upload did not finish." };
  }

  return { ok: true, key: signed.key };
}

/** Upload several files, stopping at the first failure. */
export async function uploadAllDirect(
  files: File[],
  kind: MediaKindName,
): Promise<{ ok: true; keys: string[] } | { ok: false; error: string }> {
  const keys: string[] = [];

  for (const file of files) {
    const result = await uploadDirect(file, kind);
    if (!result.ok) return result;
    keys.push(result.key);
  }

  return { ok: true, keys };
}
