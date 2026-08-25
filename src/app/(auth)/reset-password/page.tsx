"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/provider";
import { useErrorToast } from "@/components/toast";

function ResetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [error, setError] = useState<string | null>(null);
  useErrorToast(error);
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("auth.linkNotValid")}
        </h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          This reset link is missing or has expired. Ask for a new one.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/forgot-password" className="font-medium underline">
            Send a new link
          </Link>
        </p>
      </>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));

    if (password !== String(form.get("confirm"))) {
      setError(t("auth.passwordsDiffer"));
      return;
    }

    setPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });
    setPending(false);

    if (error) {
      setError(error.message ?? t("auth.linkExpired"));
      return;
    }
    router.push("/sign-in");
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        {t("auth.newPasswordTitle")}
      </h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">{t("auth.newPassword")}</span>
          <input
            required
            minLength={10}
            name="password"
            type="password"
            autoComplete="new-password"
            className="input mt-1"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            {t("auth.passwordHint")}
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">
            {t("auth.repeatPassword")}
          </span>
          <input
            required
            minLength={10}
            name="confirm"
            type="password"
            autoComplete="new-password"
            className="input mt-1"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-lg w-full"
        >
          {pending ? t("action.saving") : t("auth.setNewPassword")}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
