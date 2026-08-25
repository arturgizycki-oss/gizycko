"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/provider";

export function DangerZone() {
  const t = useT();
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
      setError(error.message ?? t("danger.failed"));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
      <h2 className="text-sm font-medium">{t("danger.title")}</h2>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {t("danger.body")}
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <a href="/api/me/export" className="btn btn-secondary btn-sm">
          {t("danger.download")}
        </a>

        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn btn-secondary btn-sm text-rose-700 dark:text-rose-400"
          >
            {t("danger.delete")}
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">{t("danger.confirmBody")}</p>
          <label className="block">
            <span className="text-sm">{t("danger.password")}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="input mt-1 max-w-xs"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={pending || password.length === 0}
              className="btn btn-primary btn-sm"
            >
              {pending ? t("danger.deleting") : t("danger.deletePermanently")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="btn btn-secondary btn-sm"
            >
              {t("action.cancel")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
