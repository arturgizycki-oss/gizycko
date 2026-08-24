"use client";

import { useActionState } from "react";
import { completeOnboarding, type OnboardingState } from "./actions";

const GENDER_LABELS: Record<string, string> = {
  MAN: "Man",
  WOMAN: "Woman",
  NONBINARY: "Non-binary",
  OTHER: "Other",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-neutral-700 dark:bg-neutral-950";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Display name</span>
        <input
          required
          name="displayName"
          defaultValue={defaultName}
          maxLength={40}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Date of birth</span>
        <input required type="date" name="birthDate" className={inputClass} />
        <span className="mt-1 block text-xs text-neutral-500">
          Only your age is shown to others, never the exact date.
        </span>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">I am a</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="cursor-pointer rounded-full border border-neutral-300 px-4 py-1.5 text-sm has-checked:border-rose-500 has-checked:bg-rose-50 dark:border-neutral-700 dark:has-checked:bg-rose-950/40"
            >
              <input
                required
                type="radio"
                name="gender"
                value={value}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">I want to meet</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="cursor-pointer rounded-full border border-neutral-300 px-4 py-1.5 text-sm has-checked:border-rose-500 has-checked:bg-rose-50 dark:border-neutral-700 dark:has-checked:bg-rose-950/40"
            >
              <input
                type="checkbox"
                name="interestedIn"
                value={value}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium">City</span>
        <input name="city" maxLength={80} placeholder="Warszawa" className={inputClass} />
      </label>

      <label className="block">
        <span className="text-sm font-medium">About you</span>
        <textarea
          name="bio"
          rows={4}
          maxLength={2000}
          placeholder="What are you into? What are you looking for?"
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
        className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
