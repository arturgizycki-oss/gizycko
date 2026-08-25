"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/provider";

export default function SignInPage() {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const { error } = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setPending(false);
    if (error) {
      // One case is worth naming: an account that exists but has never
      // confirmed its address would otherwise look like a wrong password, and
      // the member would try the same details forever.
      setError(
        error.status === 403
          ? t("auth.mustVerify")
          : // Deliberately vague: do not reveal whether the email exists.
            t("auth.wrongCredentials"),
      );
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        {t("auth.welcomeBack")}
      </h1>

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

        <label className="block">
          <span className="text-sm font-medium">{t("auth.password")}</span>
          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
            className="input mt-1"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-lg w-full"
        >
          {pending ? t("auth.signingIn") : t("auth.signIn")}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-neutral-500 underline">
          {t("auth.forgot")}
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-neutral-500">
        {t("auth.noAccount")}{" "}
        <Link href="/sign-up" className="font-medium underline">
          {t("auth.createOne")}
        </Link>
      </p>
    </>
  );
}
