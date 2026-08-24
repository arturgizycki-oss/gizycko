"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
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
        <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          If an account exists for that address, we have sent a link to reset the
          password. It expires in an hour.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/sign-in" className="font-medium underline">
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="mt-1 text-sm text-neutral-500">
        We will email you a link to set a new one.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/sign-in" className="font-medium underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
