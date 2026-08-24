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
  "input mt-1";

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
              className="chip"
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
              className="chip"
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
        className="btn btn-primary btn-lg w-full"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
