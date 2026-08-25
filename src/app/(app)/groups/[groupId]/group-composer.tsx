"use client";

import { useActionState } from "react";
import { useState } from "react";
import { postToGroup, type GroupState } from "../actions";
import { CameraShot, VoiceRecorder } from "@/components/media-capture";
import {
  FilmIcon,
  ICON_BUTTON_LABELLED,
  ImageIcon,
  MusicIcon,
} from "@/components/icons";
import { MAX_POST_IMAGES } from "@/lib/post-limits";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function GroupComposer({ groupId }: { groupId: string }) {
  const [attached, setAttached] = useState<string[]>([]);

  const action = postToGroup.bind(null, groupId);
  const [state, formAction, pending] = useActionState<GroupState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="card p-4">
      <textarea
        name="body"
        rows={3}
        maxLength={5000}
        placeholder="Share something with the group"
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--ink-muted)]"
      />

      {attached.length > 0 && (
        <p className="hint mt-2">Attached: {attached.join(", ")}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
        <label className={ICON_BUTTON_LABELLED} title="Photos">
          <ImageIcon className="size-4" />
          Photos
          <input
            type="file"
            name="images"
            accept={IMAGE_TYPES.join(",")}
            multiple
            onChange={(event) =>
              setAttached((current) => [
                ...current.filter((n) => !n.startsWith("photo")),
                ...(event.target.files?.length
                  ? [`photos (${Math.min(event.target.files.length, MAX_POST_IMAGES)})`]
                  : []),
              ])
            }
            className="sr-only"
          />
        </label>

        <label className={ICON_BUTTON_LABELLED} title="Song">
          <MusicIcon className="size-4" />
          Song
          <input type="file" name="song" accept="audio/*" className="sr-only" />
        </label>

        <label className={ICON_BUTTON_LABELLED} title="Video">
          <FilmIcon className="size-4" />
          Video
          <input type="file" name="video" accept="video/*" className="sr-only" />
        </label>

        <VoiceRecorder label="Voice" />
        <CameraShot label="Camera" />

        <span className="hint ml-auto">Only members can see this.</span>
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Posting…" : "Post"}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
