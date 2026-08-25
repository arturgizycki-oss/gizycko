import { randomUUID } from "node:crypto";
import { checkUploadedImage } from "./image";
import { checkUploadedAudio, titleFromFileName } from "./audio";
import { checkUploadedVideo } from "./video";
import { checkUploadedVoice } from "./voice";
import { mediaUrl, putObject } from "./storage";
import { MAX_POST_IMAGES } from "./post-limits";
import { verifyUploaded } from "./uploads";
import { titleFromFileName as titleFromName } from "./audio";

export type PostMedia = {
  images: { url: string; position: number }[];
  audioUrl: string | null;
  audioTitle: string | null;
  audioType: string | null;
  videoUrl: string | null;
  videoType: string | null;
};

export type PostMediaResult =
  | { ok: true; media: PostMedia; hasAny: boolean }
  | { ok: false; error: string };

const EMPTY: PostMedia = {
  images: [],
  audioUrl: null,
  audioTitle: null,
  audioType: null,
  videoUrl: null,
  videoType: null,
};

/**
 * Pull photos, a song, and a video off a post form, check each by magic bytes,
 * and store them.
 *
 * Everything is validated before a single byte is written, so a bad video does
 * not leave orphaned images behind in storage. Shared by the main feed and by
 * groups, which accept exactly the same attachments.
 */
/** Keys the browser put in the bucket itself, rather than files in the body. */
function keysFrom(formData: FormData, field: string): string[] {
  return formData
    .getAll(field)
    .filter(
      (entry): entry is string => typeof entry === "string" && entry.length > 0,
    );
}

/**
 * Attachments that were uploaded straight to the bucket.
 *
 * The browser holds a signed URL and puts the bytes there itself, so nothing
 * large travels through a Server Action - which matters because a serverless
 * request body is capped at a few megabytes and a video is not.
 *
 * A key is a claim, not proof. Every one is checked here for ownership, size
 * and magic bytes before it is attached to anything, and deleted if it fails.
 */
async function readUploadedKeys(
  formData: FormData,
  userId: string,
): Promise<PostMediaResult | null> {
  const imageKeys = keysFrom(formData, "imageKeys").slice(0, MAX_POST_IMAGES);
  const [songKey] = keysFrom(formData, "songKey");
  const [voiceKey] = keysFrom(formData, "voiceKey");
  const [videoKey] = keysFrom(formData, "videoKey");

  if (!imageKeys.length && !songKey && !voiceKey && !videoKey) return null;

  const media: PostMedia = { ...EMPTY, images: [] };

  for (const [index, key] of imageKeys.entries()) {
    const checked = await verifyUploaded(key, "image", userId);
    if (!checked.ok) return { ok: false, error: checked.error };
    media.images.push({ url: mediaUrl(key), position: index });
  }

  const audioKey = songKey ?? voiceKey;
  if (audioKey) {
    const kind = songKey ? "audio" : "voice";
    const checked = await verifyUploaded(audioKey, kind, userId);
    if (!checked.ok) return { ok: false, error: checked.error };

    media.audioUrl = mediaUrl(audioKey);
    media.audioType = checked.media.contentType;
    media.audioTitle = songKey
      ? titleFromName(String(formData.get("songName") ?? "")) ||
        "Untitled track"
      : "Voice note";
  }

  if (videoKey) {
    const checked = await verifyUploaded(videoKey, "video", userId);
    if (!checked.ok) return { ok: false, error: checked.error };

    media.videoUrl = mediaUrl(videoKey);
    media.videoType = checked.media.contentType;
  }

  return { ok: true, media, hasAny: true };
}

export async function readPostMedia(
  formData: FormData,
  userId: string,
  prefix: string,
): Promise<PostMediaResult> {
  // Bucket-first. Files in the body are the fallback for the local driver,
  // which cannot sign an upload.
  const uploaded = await readUploadedKeys(formData, userId);
  if (uploaded) return uploaded;

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_POST_IMAGES);

  const songEntry = formData.get("song");
  const song =
    songEntry instanceof File && songEntry.size > 0 ? songEntry : null;

  const videoEntry = formData.get("video");
  const video =
    videoEntry instanceof File && videoEntry.size > 0 ? videoEntry : null;

  const voiceEntry = formData.get("voice");
  const voice =
    voiceEntry instanceof File && voiceEntry.size > 0 ? voiceEntry : null;

  if (images.length === 0 && !song && !video && !voice) {
    return { ok: true, media: EMPTY, hasAny: false };
  }

  const uploads: { key: string; bytes: Buffer }[] = [];
  const media: PostMedia = { ...EMPTY, images: [] };

  for (const [index, image] of images.entries()) {
    const checked = await checkUploadedImage(image);
    if (!checked.ok) return { ok: false, error: checked.error };

    const key = `${prefix}/${userId}/${randomUUID()}${checked.kind.extension}`;
    uploads.push({ key, bytes: checked.bytes });
    media.images.push({ url: mediaUrl(key), position: index });
  }

  if (song) {
    const checked = await checkUploadedAudio(song);
    if (!checked.ok) return { ok: false, error: checked.error };

    const key = `${prefix}-songs/${userId}/${randomUUID()}${checked.kind.extension}`;
    uploads.push({ key, bytes: checked.bytes });
    media.audioUrl = mediaUrl(key);
    media.audioTitle = titleFromFileName(song.name) || "Untitled track";
    media.audioType = checked.kind.contentType;
  }

  // A recording occupies the same slot as a song; you attach one or the other.
  if (voice && !song) {
    const checked = await checkUploadedVoice(voice);
    if (!checked.ok) return { ok: false, error: checked.error };

    const key = `${prefix}-voice/${userId}/${randomUUID()}${checked.kind.extension}`;
    uploads.push({ key, bytes: checked.bytes });
    media.audioUrl = mediaUrl(key);
    media.audioTitle = "Voice note";
    media.audioType = checked.kind.contentType;
  }

  if (video) {
    const checked = await checkUploadedVideo(video);
    if (!checked.ok) return { ok: false, error: checked.error };

    const key = `${prefix}-videos/${userId}/${randomUUID()}${checked.kind.extension}`;
    uploads.push({ key, bytes: checked.bytes });
    media.videoUrl = mediaUrl(key);
    media.videoType = checked.kind.contentType;
  }

  await Promise.all(
    uploads.map((upload) => putObject(upload.key, upload.bytes)),
  );

  return { ok: true, media, hasAny: true };
}
