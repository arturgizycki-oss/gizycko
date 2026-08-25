import { MAX_IMAGE_BYTES, sniffImage } from "./image";
import { MAX_AUDIO_BYTES, sniffAudio } from "./audio";
import { MAX_VIDEO_BYTES, sniffVideo } from "./video";
import { MAX_VOICE_BYTES, sniffVoice } from "./voice";

/** The kinds of file a member can upload, and where each one is kept. */
export type MediaKindName = "image" | "audio" | "video" | "voice";

type Spec = {
  maxBytes: number;
  /** Folder the key starts with, so a bucket listing is readable. */
  prefix: string;
  /** Reads the first bytes and returns the real format, or null. */
  sniff: (bytes: Uint8Array) => { extension: string; contentType: string } | null;
  /** Everything the sniffer for this kind can recognise. */
  extensions: readonly string[];
};

export const MEDIA_KINDS: Record<MediaKindName, Spec> = {
  image: {
    maxBytes: MAX_IMAGE_BYTES,
    prefix: "images",
    sniff: sniffImage,
    extensions: [".jpg", ".png", ".webp", ".gif"],
  },
  audio: {
    maxBytes: MAX_AUDIO_BYTES,
    prefix: "audio",
    sniff: sniffAudio,
    extensions: [".mp3", ".m4a", ".ogg", ".flac", ".wav"],
  },
  video: {
    maxBytes: MAX_VIDEO_BYTES,
    prefix: "video",
    sniff: sniffVideo,
    extensions: [".mp4", ".webm", ".mov"],
  },
  voice: {
    maxBytes: MAX_VOICE_BYTES,
    prefix: "voice",
    sniff: sniffVoice,
    extensions: [".weba", ".oga", ".m4a", ".mp3", ".wav"],
  },
};

export function isMediaKind(value: unknown): value is MediaKindName {
  return typeof value === "string" && value in MEDIA_KINDS;
}

/**
 * How many bytes a format signature needs.
 *
 * The longest check reads an ftyp box twelve bytes in; thirty-two is room to
 * spare and still one small range request.
 */
export const SNIFF_BYTES = 32;
