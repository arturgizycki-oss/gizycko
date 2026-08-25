"use client";

import { useActionState, useEffect, useState } from "react";
import { completeOnboarding, type OnboardingState } from "./actions";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { useErrorToast, useToast } from "@/components/toast";
import { prepareUploadOne } from "@/lib/upload-form";
import { MAX_IMAGE_BYTES } from "@/lib/image";
import { UserIcon } from "@/components/icons";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Gender values as stored, paired with the key that names each one. */
const GENDER_LABELS: Record<string, MessageKey> = {
  MAN: "gender.man",
  WOMAN: "gender.woman",
  NONBINARY: "gender.nonbinary",
  OTHER: "gender.other",
};

const inputClass = "input mt-1";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const t = useT();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<
    OnboardingState,
    FormData
  >(completeOnboarding, {});
  useErrorToast(state.error);

  const [photo, setPhoto] = useState<{ name: string; preview: string } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);

  // Each preview holds a blob in memory until it is revoked.
  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.preview);
  }, [photo]);

  function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPhoto(null);
      return;
    }

    if (!ACCEPTED.includes(file.type)) {
      toast(t("photos.badType"));
      event.target.value = "";
      setPhoto(null);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast(t("photos.tooBig"));
      event.target.value = "";
      setPhoto(null);
      return;
    }

    setPhoto({ name: file.name, preview: URL.createObjectURL(file) });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    event.preventDefault();

    // The photograph goes to the bucket first; only its key travels with the
    // action, which is what keeps a 5 MB picture under the host's body limit.
    setUploading(true);
    const prepared = await prepareUploadOne(form, "photo", "photoKey");
    setUploading(false);

    if (!prepared.ok) {
      toast(prepared.error);
      return;
    }
    formAction(prepared.data);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <span className="text-sm font-medium">{t("onboarding.photo")}</span>
        <p className="hint mt-0.5">{t("onboarding.photoWhy")}</p>

        <div className="mt-2 flex items-center gap-3">
          {photo ? (
            /* A blob: URL from the picker - next/image needs a known source. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photo.preview}
              alt=""
              className="size-20 shrink-0 rounded-xl border border-[var(--line)] object-cover"
            />
          ) : (
            <span className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-[var(--line)] text-[var(--ink-muted)]">
              <UserIcon className="size-7" />
            </span>
          )}

          <label className="btn btn-secondary btn-sm">
            {photo ? t("photos.change") : t("photos.choose")}
            <input
              required
              type="file"
              name="photo"
              accept={ACCEPTED.join(",")}
              onChange={onPhotoChange}
              className="sr-only"
            />
          </label>

          <span className="muted min-w-0 flex-1 truncate text-xs">
            {photo?.name ?? "JPEG, PNG, WebP, GIF"}
          </span>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium">{t("profile.displayName")}</span>
        <input
          required
          name="displayName"
          defaultValue={defaultName}
          maxLength={40}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">
          {t("onboarding.dateOfBirth")}
        </span>
        <input required type="date" name="birthDate" className={inputClass} />
        <span className="mt-1 block text-xs text-neutral-500">
          {t("onboarding.ageNote")}
        </span>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">{t("onboarding.iAm")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <label key={value} className="chip">
              <input
                required
                type="radio"
                name="gender"
                value={value}
                className="sr-only"
              />
              {t(label)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">
          {t("profile.wantToMeet")}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <label key={value} className="chip">
              <input
                type="checkbox"
                name="interestedIn"
                value={value}
                className="sr-only"
              />
              {t(label)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium">{t("profile.city")}</span>
        <input
          name="city"
          maxLength={80}
          placeholder={t("profile.city")}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t("profile.bio")}</span>
        <textarea
          name="bio"
          rows={4}
          maxLength={2000}
          placeholder={t("onboarding.bioPlaceholder")}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={pending || uploading}
        className="btn btn-primary btn-lg w-full"
      >
        {pending || uploading ? t("action.saving") : t("onboarding.continue")}
      </button>
    </form>
  );
}
