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
  ICON_BUTTON,
  ImageIcon,
  MusicIcon,
  SmileIcon,
} from "@/components/icons";
import { useT } from "@/lib/i18n/provider";
import { useErrorToast, useToast } from "@/components/toast";
import { prepareUploads } from "@/lib/upload-form";
import { PICKER_IMAGE_TYPES } from "@/lib/image-types";

const IMAGE_TYPES = PICKER_IMAGE_TYPES;

function megabytes(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

export function Composer() {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<PostState, FormData>(
    createPost,
    {},
  );
  const [uploading, setUploading] = useState(false);

  /*
   * Attachments go to the bucket before the form is submitted, and only their
   * keys travel with the action. Sent inline, anything over a few megabytes is
   * refused by the host before our code runs, which the browser shows as a
   * blank error page rather than something a member can act on.
   */
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    event.preventDefault();

    setUploading(true);
    const prepared = await prepareUploads(form);
    setUploading(false);

    if (!prepared.ok) {
      toast(prepared.error);
      return;
    }

    formAction(prepared.data);
  }

  return (
    <form onSubmit={onSubmit} className="card relative p-4">
      {/* Remounting on a new submission id clears the text, the files, and the
          previews without resetting state from inside an effect. */}
      <ComposerFields
        key={state.submissionId ?? "new"}
        pending={pending || uploading}
        serverError={state.error}
        attempt={state.attempt}
      />
    </form>
  );
}

type Selected = { file: File; preview: string };

function ComposerFields({
  pending,
  serverError,
  attempt,
}: {
  pending: boolean;
  serverError?: string;
  attempt?: string;
}) {
  const t = useT();
  const body = useRef<HTMLTextAreaElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [images, setImages] = useState<Selected[]>([]);
  const [song, setSong] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [clientError, setClientError] = useState<{
    text: string;
    nonce: number;
  } | null>(null);
  const refusals = useRef(0);

  function refuse(text: string) {
    setClientError({ text, nonce: (refusals.current += 1) });
  }

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
      refuse(`You can attach at most ${MAX_POST_IMAGES} photos.`);
      event.target.value = "";
      replaceImages([]);
      return;
    }

    const bad = chosen.find(
      (file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES,
    );
    if (bad) {
      refuse(
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
      refuse(
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
      refuse(
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

  const error = clientError?.text ?? serverError;
  useErrorToast(error, clientError ? `own-${clientError.nonce}` : attempt);

  return (
    <>
      <textarea
        ref={body}
        name="body"
        rows={3}
        maxLength={5000}
        placeholder={t("composer.placeholder")}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--ink-muted)]"
      />

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {images.map((item) => (
            <li
              key={item.preview}
              className="relative aspect-square overflow-hidden rounded-lg"
            >
              {/* A blob: URL from the file picker - next/image needs a source
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
        <label className={ICON_BUTTON} title={t("composer.photos")}>
          <ImageIcon className="size-5" />
          <span className="sr-only">{t("composer.photos")}</span>
          <input
            type="file"
            name="images"
            accept={IMAGE_TYPES.join(",")}
            multiple
            onChange={onImagesChange}
            className="sr-only"
          />
        </label>

        <label className={ICON_BUTTON} title={t("composer.song")}>
          <MusicIcon className="size-5" />
          <span className="sr-only">{t("composer.song")}</span>
          <input
            type="file"
            name="song"
            accept="audio/mpeg,audio/mp4,audio/ogg,audio/flac,audio/wav,.mp3,.m4a,.ogg,.flac,.wav"
            onChange={onSongChange}
            className="sr-only"
          />
        </label>

        <label className={ICON_BUTTON} title={t("composer.video")}>
          <FilmIcon className="size-5" />
          <span className="sr-only">{t("composer.video")}</span>
          <input
            type="file"
            name="video"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={onVideoChange}
            className="sr-only"
          />
        </label>

        <VoiceRecorder />
        <CameraShot />

        <span className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji((open) => !open)}
            aria-label={t("composer.emoji")}
            aria-expanded={showEmoji}
            title={t("composer.emoji")}
            className={ICON_BUTTON}
          >
            <SmileIcon className="size-5" />
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
          {t("composer.visibleTo")}{" "}
          <select
            name="visibility"
            defaultValue="FRIENDS"
            className="rounded border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
          >
            <option value="FRIENDS">{t("visibility.friends")}</option>
            <option value="MATCHES">{t("visibility.matches")}</option>
            <option value="PUBLIC">{t("visibility.public")}</option>
            <option value="PRIVATE">{t("visibility.private")}</option>
          </select>
        </label>

        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? t("action.posting") : t("action.post")}
        </button>
      </div>
    </>
  );
}
