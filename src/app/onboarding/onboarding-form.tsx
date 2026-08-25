"use client";

import { useActionState } from "react";
import { completeOnboarding, type OnboardingState } from "./actions";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";

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
  const [state, formAction, pending] = useActionState<
    OnboardingState,
    FormData
  >(completeOnboarding, {});

  return (
    <form action={formAction} className="mt-8 space-y-5">
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

      {state.error && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-lg w-full"
      >
        {pending ? t("action.saving") : t("onboarding.continue")}
      </button>
    </form>
  );
}
