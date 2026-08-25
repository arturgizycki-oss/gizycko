import { randomUUID } from "node:crypto";
import { checkUploadedImage } from "./image";
import { checkUploadedAudio, titleFromFileName } from "./audio";
import { checkUploadedVideo } from "./video";
import { checkUploadedVoice } from "./voice";
import { mediaUrl, putObject } from "./storage";
import { MAX_POST_IMAGES } from "./post-limits";

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
export async function readPostMedia(
  formData: FormData,
  userId: string,
  prefix: string,
): Promise<PostMediaResult> {
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
