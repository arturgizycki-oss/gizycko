"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "./actions";

const GENDER_LABELS: Record<string, string> = {
  MAN: "Man",
  WOMAN: "Woman",
  NONBINARY: "Non-binary",
  OTHER: "Other",
};

const inputClass =
  "input mt-1";

export type ProfileFormValues = {
  displayName: string;
  bio: string | null;
  occupation: string | null;
  city: string | null;
  interestedIn: string[];
  minAgePref: number;
  maxAgePref: number;
  maxDistanceKm: number;
  isVisible: boolean;
};

export function ProfileForm({ profile }: { profile: ProfileFormValues }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="text-sm font-medium">Edit profile</h2>

      <label className="block">
        <span className="text-sm font-medium">Display name</span>
        <input
          required
          name="displayName"
          defaultValue={profile.displayName}
          maxLength={40}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">About you</span>
        <textarea
          name="bio"
          rows={4}
          maxLength={2000}
          defaultValue={profile.bio ?? ""}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Work</span>
          <input
            name="occupation"
            maxLength={80}
            defaultValue={profile.occupation ?? ""}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">City</span>
          <input
            name="city"
            maxLength={80}
            defaultValue={profile.city ?? ""}
            className={inputClass}
          />
        </label>
      </div>

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
                defaultChecked={profile.interestedIn.includes(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Min age</span>
          <input
            type="number"
            name="minAgePref"
            min={18}
            max={99}
            defaultValue={profile.minAgePref}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Max age</span>
          <input
            type="number"
            name="maxAgePref"
            min={18}
            max={99}
            defaultValue={profile.maxAgePref}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Distance (km)</span>
          <input
            type="number"
            name="maxDistanceKm"
            min={1}
            max={500}
            defaultValue={profile.maxDistanceKm}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isVisible"
          defaultChecked={profile.isVisible}
        />
        Show my profile in Discover
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-emerald-600">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
