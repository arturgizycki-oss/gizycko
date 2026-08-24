"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    setError(null);

    const { error } = await authClient.deleteUser({ password });

    setPending(false);
    if (error) {
      setError(error.message ?? "Could not delete the account.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
      <h2 className="text-sm font-medium">Your data</h2>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        You can download everything we hold about you, or delete your account
        permanently.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <a
          href="/api/me/export"
          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold dark:border-neutral-700"
        >
          Download my data
        </a>

        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-400"
          >
            Delete my account
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">
            This deletes your profile, photos, matches, messages, and posts. It
            cannot be undone.
          </p>
          <label className="block">
            <span className="text-sm">Confirm with your password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={pending || password.length === 0}
              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold dark:border-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
