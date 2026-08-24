"use client";

import { useActionState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  deletePhoto,
  setPrimaryPhoto,
  uploadPhoto,
  type ActionState,
} from "./actions";
import { MAX_PROFILE_PHOTOS } from "@/lib/image";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    uploadPhoto,
    {},
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Photos</h2>
        <span className="text-xs text-neutral-500">
          {photos.length} / {MAX_PROFILE_PHOTOS}
        </span>
      </div>

      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <li key={photo.id} className="space-y-1">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
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
                {photo.isPrimary && (
                  <span className="absolute top-1 left-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Main
                  </span>
                )}
              </div>

              <p className="text-[10px] text-neutral-500">
                {MODERATION_LABEL[photo.moderation]}
              </p>

              <div className="flex gap-2 text-xs">
                {!photo.isPrimary && (
                  <form action={setPrimaryPhoto.bind(null, photo.id)}>
                    <button type="submit" className="text-neutral-500 hover:underline">
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

      {photos.length < MAX_PROFILE_PHOTOS && (
        <form ref={formRef} action={formAction} className="mt-4 flex items-center gap-3">
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-xs file:font-medium dark:file:bg-neutral-800"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}
    </section>
  );
}
