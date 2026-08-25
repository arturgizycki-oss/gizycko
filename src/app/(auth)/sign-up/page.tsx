"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/provider";

export default function SignUpPage() {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const { error } = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setPending(false);
    if (error) {
      setError(error.message ?? t("auth.createFailed"));
      return;
    }
    router.push("/onboarding");
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        {t("auth.createAccount")}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{t("auth.over18")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label={t("auth.firstName")}
          name="name"
          type="text"
          autoComplete="given-name"
        />
        <Field
          label={t("auth.email")}
          name="email"
          type="email"
          autoComplete="email"
        />
        <Field
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          hint={t("auth.passwordHint")}
        />

        <label className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <input type="checkbox" name="terms" required className="mt-0.5" />
          <span>
            {t("auth.termsAccept")}{" "}
            <Link href="/terms" className="underline">
              {t("auth.terms")}
            </Link>{" "}
            {t("auth.and")}{" "}
            <Link href="/privacy" className="underline">
              {t("auth.privacy")}
            </Link>
          </span>
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
          {pending ? t("auth.creating") : t("auth.createAccount")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {t("auth.haveAccount")}{" "}
        <Link href="/sign-in" className="font-medium underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input required {...props} className="input mt-1" />
      {hint && (
        <span className="mt-1 block text-xs text-neutral-500">{hint}</span>
      )}
    </label>
  );
}
