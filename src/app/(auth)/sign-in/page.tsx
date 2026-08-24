"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { PhotoBackdrop } from "@/components/photo-backdrop";
import { GIZYCKO_PHOTOS } from "@/lib/photo-credits";

export default function SignInPage() {
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
      // Deliberately vague: do not reveal whether the email exists.
      setError("Wrong email or password.");
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <>
      <PhotoBackdrop photo={GIZYCKO_PHOTOS.sunset} overlay="medium" priority />
      <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="input mt-1"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Password</span>
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
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-neutral-500 underline">
          Forgot your password?
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-neutral-500">
        No account yet?{" "}
        <Link href="/sign-up" className="font-medium underline">
          Create one
        </Link>
      </p>
    </>
  );
}
