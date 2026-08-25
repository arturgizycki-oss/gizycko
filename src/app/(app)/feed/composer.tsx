"use client";

import { useActionState, useRef, useState } from "react";
import { createPost, type PostState } from "./actions";
import { MAX_POST_IMAGES } from "@/lib/post-limits";
import { MAX_IMAGE_BYTES } from "@/lib/image";
import { MAX_AUDIO_BYTES } from "@/lib/audio";
import { MAX_VIDEO_BYTES } from "@/lib/video";
import { CameraShot, VoiceRecorder } from "@/components/media-capture";
import { EmojiPicker } from "@/components/emoji-picker";
import {
  FilmIcon,
  ICON_BUTTON_LABELLED,
  ImageIcon,
  MusicIcon,
  SmileIcon,
} from "@/components/icons";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function megabytes(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

export function Composer() {
  const [state, formAction, pending] = useActionState<PostState, FormData>(
    createPost,
    {},
  );

  return (
    <form
      action={formAction}
      className="card relative p-4"
    >
      {/* Remounting on a new submission id clears the text, the files, and the
          previews without resetting state from inside an effect. */}
      <ComposerFields
        key={state.submissionId ?? "new"}
        pending={pending}
        serverError={state.error}
      />
    </form>
  );
}

type Selected = { file: File; preview: string };

function ComposerFields({
  pending,
  serverError,
}: {
  pending: boolean;
  serverError?: string;
}) {
  const body = useRef<HTMLTextAreaElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [images, setImages] = useState<Selected[]>([]);
  const [song, setSong] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  function replaceImages(next: Selected[]) {
    setImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview));
      return next;
    });
  }

  function onImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const chosen = Array.from(event.target.files ?? []);

    if (chosen.length > MAX_POST_IMAGES) {
      setClientError(`You can attach at most ${MAX_POST_IMAGES} photos.`);
      event.target.value = "";
      replaceImages([]);
      return;
    }

    const bad = chosen.find(
      (file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES,
    );
    if (bad) {
      setClientError(
        bad.size > MAX_IMAGE_BYTES
          ? `${bad.name} is ${megabytes(bad.size)} MB. Photos must be under 5 MB.`
          : `${bad.name} is not a JPEG, PNG, WebP, or GIF.`,
      );
      event.target.value = "";
      replaceImages([]);
      return;
    }

    replaceImages(
      chosen.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    );
  }

  function onSongChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const file = event.target.files?.[0] ?? null;

    if (file && file.size > MAX_AUDIO_BYTES) {
      setClientError(
        `${file.name} is ${megabytes(file.size)} MB. Songs must be under 10 MB.`,
      );
      event.target.value = "";
      setSong(null);
      return;
    }

    setSong(file);
  }

  function onVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const file = event.target.files?.[0] ?? null;

    if (file && file.size > MAX_VIDEO_BYTES) {
      setClientError(
        `${file.name} is ${megabytes(file.size)} MB. Videos must be under 30 MB.`,
      );
      event.target.value = "";
      setVideo(null);
      return;
    }

    setVideo(file);
  }

  /** Insert at the caret, so an emoji can land mid-sentence. */
  function insertEmoji(emoji: string) {
    const field = body.current;
    if (!field) return;

    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;

    field.value = field.value.slice(0, start) + emoji + field.value.slice(end);
    field.focus();
    field.selectionStart = field.selectionEnd = start + emoji.length;
  }

  const error = clientError ?? serverError;

  return (
    <>
      <textarea
        ref={body}
        name="body"
        rows={3}
        maxLength={5000}
        placeholder="What is going on?"
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--ink-muted)]"
      />

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {images.map((item) => (
            <li
              key={item.preview}
              className="relative aspect-square overflow-hidden rounded-lg"
            >
              {/* A blob: URL from the file picker — next/image needs a source
                  the server knows about, so a plain img is correct here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt={item.file.name}
                className="size-full object-cover"
              />
            </li>
          ))}
        </ul>
      )}

      {song && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs">
          <MusicIcon className="size-4 shrink-0" />
          <span className="truncate font-medium">{song.name}</span>
          <span className="muted ml-auto shrink-0">
            {megabytes(song.size)} MB
          </span>
        </p>
      )}

      {video && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs">
          <FilmIcon className="size-4 shrink-0" />
          <span className="truncate font-medium">{video.name}</span>
          <span className="muted ml-auto shrink-0">
            {megabytes(video.size)} MB
          </span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-[var(--line)] pt-3">
        <label className={ICON_BUTTON_LABELLED} title="Photos">
          <ImageIcon className="size-4" />
          Photos
          <input
            type="file"
            name="images"
            accept={IMAGE_TYPES.join(",")}
            multiple
            onChange={onImagesChange}
            className="sr-only"
          />
        </label>

        <label className={ICON_BUTTON_LABELLED} title="Song">
          <MusicIcon className="size-4" />
          Song
          <input
            type="file"
            name="song"
            accept="audio/mpeg,audio/mp4,audio/ogg,audio/flac,audio/wav,.mp3,.m4a,.ogg,.flac,.wav"
            onChange={onSongChange}
            className="sr-only"
          />
        </label>

        <label className={ICON_BUTTON_LABELLED} title="Video">
          <FilmIcon className="size-4" />
          Video
          <input
            type="file"
            name="video"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={onVideoChange}
            className="sr-only"
          />
        </label>

        <VoiceRecorder label="Voice" />
        <CameraShot label="Camera" />

        <span className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji((open) => !open)}
            aria-label="Emoji"
            aria-expanded={showEmoji}
            title="Emoji"
            className={ICON_BUTTON_LABELLED}
          >
            <SmileIcon className="size-4" />
          </button>

          {showEmoji && (
            <EmojiPicker
              placement="bottom"
              onPick={insertEmoji}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </span>

        <label className="ml-auto flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
          Visible to{" "}
          <select
            name="visibility"
            defaultValue="FRIENDS"
            className="rounded border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
          >
            <option value="FRIENDS">Friends</option>
            <option value="MATCHES">Matches</option>
            <option value="PUBLIC">Everyone</option>
            <option value="PRIVATE">Only me</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {error}
        </p>
      )}
    </>
  );
}
