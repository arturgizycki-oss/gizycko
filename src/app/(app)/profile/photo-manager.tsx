"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import {
  deletePhoto,
  setPrimaryPhoto,
  uploadPhoto,
  type ActionState,
} from "./actions";
import { MAX_IMAGE_BYTES, MAX_PROFILE_PHOTOS } from "@/lib/image";
import { Lightbox } from "@/components/photo-lightbox";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type PhotoItem = {
  id: string;
  url: string;
  isPrimary: boolean;
  moderation: "PENDING" | "APPROVED" | "REJECTED";
};

const MODERATION_LABEL: Record<PhotoItem["moderation"], string> = {
  PENDING: "Visible · awaiting review",
  APPROVED: "Reviewed",
  REJECTED: "Rejected · hidden from others",
};

export function PhotoManager({ photos }: { photos: PhotoItem[] }) {
  const [viewing, setViewing] = useState<number | null>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    uploadPhoto,
    {},
  );

  const urls = photos.map((photo) => photo.url);

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Photos</h2>
        <span className="hint">
          {photos.length} / {MAX_PROFILE_PHOTOS}
        </span>
      </div>

      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="space-y-1">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <button
                  type="button"
                  onClick={() => setViewing(index)}
                  aria-label="See this photo full size"
                  className="absolute inset-0 cursor-zoom-in"
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    sizes="200px"
                    className={
                      photo.moderation === "REJECTED"
                        ? "object-cover opacity-40"
                        : "object-cover"
                    }
                  />
                </button>
                {photo.isPrimary && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Main
                  </span>
                )}
              </div>

              <p className="text-[10px] text-[var(--ink-muted)]">
                {MODERATION_LABEL[photo.moderation]}
              </p>

              <div className="flex gap-2 text-xs">
                {!photo.isPrimary && (
                  <form action={setPrimaryPhoto.bind(null, photo.id)}>
                    <button type="submit" className="muted hover:underline">
                      Make main
                    </button>
                  </form>
                )}
                <form action={deletePhoto.bind(null, photo.id)}>
                  <button type="submit" className="text-rose-600 hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewing !== null && (
        <Lightbox
          photos={urls}
          index={viewing}
          onClose={() => setViewing(null)}
          onIndex={setViewing}
        />
      )}

      {photos.length < MAX_PROFILE_PHOTOS && (
        <form action={formAction} className="mt-4">
          {/* Remounting on a new submission id clears the picker, rather than
              resetting state from inside an effect. */}
          <UploadFields
            key={state.submissionId ?? "new"}
            pending={pending}
            serverError={state.error}
          />
        </form>
      )}
    </section>
  );
}

function UploadFields({
  pending,
  serverError,
}: {
  pending: boolean;
  serverError?: string;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  /**
   * Check size and type before the file leaves the browser. Without this an
   * oversized upload is rejected by the server before our code runs, and the
   * only thing the user sees is an unexplained "Failed to fetch".
   */
  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    setChosen(null);

    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setClientError("Only JPEG, PNG, WebP, and GIF images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setClientError(`That image is ${mb} MB. The limit is 5 MB.`);
      event.target.value = "";
      return;
    }

    setChosen(file.name);
  }

  const error = clientError ?? serverError;

  return (
    <>
      <div className="flex items-center gap-3">
        {/*
          The native file input renders its own button plus "No file chosen".
          Hiding it inside a label gives one control we style ourselves, with
          the chosen filename shown beside it.
        */}
        <label className="btn btn-secondary btn-sm cursor-pointer">
          {chosen ? "Change photo" : "Choose a photo"}
          <input
            type="file"
            name="photo"
            accept={ACCEPTED.join(",")}
            onChange={onFileChange}
            required
            className="sr-only"
          />
        </label>

        <span className="muted min-w-0 flex-1 truncate text-xs">
          {chosen ?? "JPEG, PNG, WebP or GIF, up to 5 MB"}
        </span>

        <button
          type="submit"
          disabled={pending || !chosen}
          className="btn btn-primary btn-sm shrink-0"
        >
          {pending ? "Uploading…" : "Upload"}
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
