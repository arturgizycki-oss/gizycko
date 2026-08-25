"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import {
  deletePhoto,
  setPrimaryPhoto,
  uploadPhoto,
  type ActionState,
} from "./actions";
import { MAX_IMAGE_BYTES, MAX_PROFILE_PHOTOS } from "@/lib/image";
import { Lightbox } from "@/components/photo-lightbox";
import { ConfirmButton } from "@/components/confirm-button";
import { useToast } from "@/components/toast";
import { prepareUploadOne } from "@/lib/upload-form";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type PhotoItem = {
  id: string;
  url: string;
  isPrimary: boolean;
  moderation: "PENDING" | "APPROVED" | "REJECTED";
};

/** Moderation state to the key that explains it. */
const MODERATION_LABEL: Record<PhotoItem["moderation"], MessageKey> = {
  PENDING: "photos.pending",
  APPROVED: "photos.approved",
  REJECTED: "photos.rejected",
};

export function PhotoManager({ photos }: { photos: PhotoItem[] }) {
  const t = useT();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    uploadPhoto,
    {},
  );

  const urls = photos.map((photo) => photo.url);

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">{t("photos.title")}</h2>
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
                  aria-label={t("photos.full")}
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
                    {t("photos.main")}
                  </span>
                )}
              </div>

              <p className="text-[10px] text-[var(--ink-muted)]">
                {t(MODERATION_LABEL[photo.moderation])}
              </p>

              <div className="flex gap-2 text-xs">
                {!photo.isPrimary && (
                  <form action={setPrimaryPhoto.bind(null, photo.id)}>
                    <button type="submit" className="muted hover:underline">
                      {t("photos.makeMain")}
                    </button>
                  </form>
                )}
                <ConfirmButton
                  label={t("action.delete")}
                  question={t("confirm.deletePhoto")}
                  destructive
                  className="text-rose-600 hover:underline"
                  formAction={deletePhoto.bind(null, photo.id)}
                />
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
        <form
          onSubmit={async (event) => {
            const form = event.currentTarget;
            event.preventDefault();

            // Straight to the bucket first. A 5 MB photograph sent through the
            // action is refused by the host before any of our code runs.
            setUploading(true);
            const prepared = await prepareUploadOne(form, "photo", "photoKey");
            setUploading(false);

            if (!prepared.ok) {
              toast(prepared.error);
              return;
            }
            formAction(prepared.data);
          }}
          className="mt-4"
        >
          {/* Remounting on a new submission id clears the picker, rather than
              resetting state from inside an effect. */}
          <UploadFields
            key={state.submissionId ?? "new"}
            pending={pending || uploading}
            serverError={state.error}
          />
        </form>
      )}
    </section>
  );
}

/** What the picker has selected, with a blob: URL to show it. */
type Chosen = { name: string; size: number; preview: string };

function UploadFields({
  pending,
  serverError,
}: {
  pending: boolean;
  serverError?: string;
}) {
  const t = useT();
  const toast = useToast();
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Each preview holds a blob in memory until it is revoked.
  useEffect(() => {
    if (!chosen) return;
    return () => URL.revokeObjectURL(chosen.preview);
  }, [chosen]);

  /**
   * Check size and type before the file leaves the browser. Without this an
   * oversized upload is rejected by the server before our code runs, and the
   * only thing the user sees is an unexplained "Failed to fetch".
   */
  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    setChosen(null);
    setConfirming(false);

    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setClientError(t("photos.badType"));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setClientError(t("photos.tooBig"));
      event.target.value = "";
      return;
    }

    setChosen({
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    });
  }

  const error = clientError ?? serverError;

  useEffect(() => {
    if (error) toast(error);
  }, [error, toast]);

  return (
    <>
      <div className="flex items-center gap-3">
        {chosen && (
          /* A blob: URL from the picker - next/image needs a source the server
             knows about, so a plain img is correct here. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={chosen.preview}
            alt=""
            className="size-14 shrink-0 rounded-xl border border-[var(--line)] object-cover"
          />
        )}

        {/*
          The native file input renders its own button plus "No file chosen".
          Hiding it inside a label gives one control we style ourselves, with
          the chosen file shown beside it.
        */}
        <label className="btn btn-secondary btn-sm shrink-0">
          {chosen ? t("photos.change") : t("photos.choose")}
          <input
            type="file"
            name="photo"
            accept={ACCEPTED.join(",")}
            onChange={onFileChange}
            required
            className="sr-only"
          />
        </label>

        <span className="min-w-0 flex-1 text-xs">
          {chosen ? (
            <>
              <span className="block truncate font-medium">{chosen.name}</span>
              <span className="hint">
                {(chosen.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </>
          ) : (
            <span className="muted">JPEG, PNG, WebP, GIF · 5 MB</span>
          )}
        </span>

        {confirming ? (
          <span className="flex shrink-0 items-center gap-2 text-xs">
            <span className="muted">{t("confirm.upload")}</span>
            <button
              type="submit"
              disabled={pending}
              className="font-semibold hover:underline"
            >
              {pending ? t("photos.uploading") : t("confirm.yes")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="muted hover:underline"
            >
              {t("confirm.no")}
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={pending || !chosen}
            onClick={() => setConfirming(true)}
            className="btn btn-primary btn-sm shrink-0"
          >
            {t("photos.upload")}
          </button>
        )}
      </div>
    </>
  );
}
