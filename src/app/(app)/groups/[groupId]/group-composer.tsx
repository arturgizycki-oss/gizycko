"use client";

import { useActionState } from "react";
import { useState } from "react";
import { postToGroup, type GroupState } from "../actions";
import { CameraShot, VoiceRecorder } from "@/components/media-capture";
import {
  FilmIcon,
  ICON_BUTTON,
  ImageIcon,
  MusicIcon,
} from "@/components/icons";
import { MAX_POST_IMAGES } from "@/lib/post-limits";
import { useT } from "@/lib/i18n/provider";
import { useErrorToast, useToast } from "@/components/toast";
import { prepareUploads } from "@/lib/upload-form";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function GroupComposer({ groupId }: { groupId: string }) {
  const toast = useToast();

  const action = postToGroup.bind(null, groupId);
  const [state, formAction, pending] = useActionState<GroupState, FormData>(
    action,
    {},
  );
  useErrorToast(state.error, state.submissionId);

  const [uploading, setUploading] = useState(false);

  // Same as the main composer: bytes to the bucket first, keys with the
  // action, because the host refuses a large body outright.
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
    <form onSubmit={onSubmit} className="card p-4">
      {/* Remounting on a new submission id clears the text and the list of
          attachments, the same way the main composer does. */}
      <GroupComposerFields
        key={state.submissionId ?? "new"}
        pending={pending || uploading}
      />
    </form>
  );
}

function GroupComposerFields({ pending }: { pending: boolean }) {
  const t = useT();
  const [attached, setAttached] = useState<string[]>([]);

  return (
    <>
      <textarea
        name="body"
        rows={3}
        maxLength={5000}
        placeholder={t("groups.composerPlaceholder")}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--ink-muted)]"
      />

      {attached.length > 0 && (
        <p className="hint mt-2">
          {t("groups.attached")}: {attached.join(", ")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
        <label className={ICON_BUTTON} title={t("composer.photos")}>
          <ImageIcon className="size-5" />
          <span className="sr-only">{t("composer.photos")}</span>
          <input
            type="file"
            name="images"
            accept={IMAGE_TYPES.join(",")}
            multiple
            onChange={(event) =>
              setAttached((current) => [
                ...current.filter((n) => !n.startsWith("photo")),
                ...(event.target.files?.length
                  ? [
                      `photos (${Math.min(event.target.files.length, MAX_POST_IMAGES)})`,
                    ]
                  : []),
              ])
            }
            className="sr-only"
          />
        </label>

        <label className={ICON_BUTTON} title={t("composer.song")}>
          <MusicIcon className="size-5" />
          <span className="sr-only">{t("composer.song")}</span>
          <input type="file" name="song" accept="audio/*" className="sr-only" />
        </label>

        <label className={ICON_BUTTON} title={t("composer.video")}>
          <FilmIcon className="size-5" />
          <span className="sr-only">{t("composer.video")}</span>
          <input
            type="file"
            name="video"
            accept="video/*"
            className="sr-only"
          />
        </label>

        <VoiceRecorder />
        <CameraShot />

        <span className="hint ml-auto">{t("groups.membersOnly")}</span>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-sm"
        >
          {pending ? t("action.posting") : t("action.post")}
        </button>
      </div>
    </>
  );
}
