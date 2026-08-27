"use client";

import { uploadDirect } from "./upload-client";
import { prepareImage } from "./image-client";
import type { MediaKindName } from "./media-kinds";

/** A file input, the kind of thing in it, and the field its key goes back as. */
type Slot = { input: string; kind: MediaKindName; keyField: string };

const SLOTS: Slot[] = [
  { input: "images", kind: "image", keyField: "imageKeys" },
  { input: "song", kind: "audio", keyField: "songKey" },
  { input: "video", kind: "video", keyField: "videoKey" },
  { input: "voice", kind: "voice", keyField: "voiceKey" },
];

export type PrepareResult =
  { ok: true; data: FormData } | { ok: false; error: string };

/**
 * Turn a composer's form into one a Server Action can actually receive.
 *
 * Files go straight to the bucket first and only their keys are submitted.
 * A serverless request body is capped at a few megabytes; a 30 MB video sent
 * through the action is rejected by the platform before any of our code runs,
 * which is why an oversized post used to fail as a blank browser error rather
 * than a message anyone could act on.
 *
 * Where the storage driver cannot sign uploads - the local disk in
 * development - this hands back the original form and the files travel the old
 * way. Nothing to configure either side.
 */
export async function prepareUploads(
  form: HTMLFormElement,
): Promise<PrepareResult> {
  const data = new FormData(form);

  for (const slot of SLOTS) {
    const files = data
      .getAll(slot.input)
      .filter(
        (entry): entry is File => entry instanceof File && entry.size > 0,
      );

    if (files.length === 0) continue;

    // The song's title comes from its filename, which the server cannot see
    // once only the key is sent.
    if (slot.kind === "audio") data.set("songName", files[0].name);

    /*
     * Redraw the photographs first, and put them back in the form.
     *
     * Both roads out of here need the prepared file: the signed upload below,
     * and the fallback that submits the form itself when signing is not
     * configured. Preparing inside the upload loop alone would leave the
     * fallback sending the original - the HEIC the server just refused.
     */
    const prepared: File[] = [];
    for (const original of files) {
      const ready = await prepareImage(original);
      if (!ready.ok) return { ok: false, error: ready.error };
      prepared.push(ready.file);
    }

    data.delete(slot.input);
    for (const file of prepared) data.append(slot.input, file);

    for (const file of prepared) {
      const result = await uploadDirect(file, slot.kind);

      if (!result.ok) {
        // No signing available: the prepared files are in the form already, so
        // they travel with the action, which is correct on a local disk.
        if (result.error === "Direct upload is not configured.")
          return { ok: true, data };
        return { ok: false, error: result.error };
      }

      data.append(slot.keyField, result.key);
    }

    // The bytes are already in the bucket; sending them again is the whole
    // problem this avoids.
    data.delete(slot.input);
  }

  return { ok: true, data };
}

/**
 * The single-file version, for forms with one attachment.
 *
 * Same bargain as prepareUploads: the bytes go to the bucket, the key goes
 * with the action, and where uploads cannot be signed the form is handed back
 * untouched so the file travels the old way.
 */
export async function prepareUploadOne(
  form: HTMLFormElement,
  inputName: string,
  keyField: string,
  kind: MediaKindName = "image",
): Promise<PrepareResult> {
  const data = new FormData(form);
  const file = data.get(inputName);

  if (!(file instanceof File) || file.size === 0) return { ok: true, data };

  const ready = await prepareImage(file);
  if (!ready.ok) return { ok: false, error: ready.error };
  data.set(inputName, ready.file);

  const result = await uploadDirect(ready.file, kind);

  if (!result.ok) {
    if (result.error === "Direct upload is not configured.")
      return { ok: true, data };
    return { ok: false, error: result.error };
  }

  data.set(keyField, result.key);
  data.delete(inputName);
  return { ok: true, data };
}

/** Which media kind a chat attachment is, from what the browser says it is. */
function kindOfFile(file: File): MediaKindName {
  const type = file.type.toLowerCase();
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "image";
}

/**
 * A chat message's one attachment, or a voice note.
 *
 * The two arrive in different fields on purpose: a recording made in the
 * browser is byte-identical to a WebM video, and only the field it came in
 * says which the sender meant.
 */
export async function prepareChatUpload(
  form: HTMLFormElement,
): Promise<PrepareResult> {
  const data = new FormData(form);

  const voice = data.get("voice");
  const attachment = data.get("attachment");

  const file =
    voice instanceof File && voice.size > 0
      ? voice
      : attachment instanceof File && attachment.size > 0
        ? attachment
        : null;

  if (!file) return { ok: true, data };

  const isVoice = voice instanceof File && voice.size > 0;
  const kind: MediaKindName = isVoice ? "voice" : kindOfFile(file);

  const ready =
    kind === "image" ? await prepareImage(file) : ({ ok: true, file } as const);
  if (!ready.ok) return { ok: false, error: ready.error };

  // Back into the form, so the fallback path sends the prepared file too.
  data.set(isVoice ? "voice" : "attachment", ready.file);

  const result = await uploadDirect(ready.file, kind);

  if (!result.ok) {
    if (result.error === "Direct upload is not configured.")
      return { ok: true, data };
    return { ok: false, error: result.error };
  }

  data.set("attachmentKey", result.key);
  data.set("attachmentKind", kind);
  data.set("attachmentName", ready.file.name || "Attachment");
  data.delete("attachment");
  data.delete("voice");

  return { ok: true, data };
}
