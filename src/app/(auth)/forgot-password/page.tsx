"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/provider";

export default function ForgotPasswordPage() {
  const t = useT();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/reset-password",
    });

    setPending(false);
    // Always the same answer, so this cannot be used to test which
    // addresses have accounts.
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("auth.checkEmail")}
        </h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          {t("auth.resetSent")}
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/sign-in" className="font-medium underline">
            {t("auth.backToSignIn")}
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        {t("auth.forgot")}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{t("auth.forgotIntro")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">{t("auth.email")}</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="input mt-1"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-lg w-full"
        >
          {pending ? t("auth.sending") : t("auth.sendResetLink")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/sign-in" className="font-medium underline">
          {t("auth.backToSignIn")}
        </Link>
      </p>
    </>
  );
}
