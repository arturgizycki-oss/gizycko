import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/feed");

  return (
    <main className="min-h-dvh bg-gradient-to-b from-rose-50 via-white to-white dark:from-rose-950/40 dark:via-neutral-950 dark:to-neutral-950">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <span className="text-lg font-semibold tracking-tight">gizycko</span>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Sign in
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Meet people nearby. Stay for the community.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
            A dating app with a real social side — match, chat, and share what
            you are up to with the people you actually know.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Create an account
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              I already have one
            </Link>
          </div>

          <p className="mt-8 text-sm text-neutral-500">
            18+ only. Be kind — every profile is a real person.
          </p>
        </section>

        <footer className="border-t border-neutral-200 py-6 text-sm text-neutral-500 dark:border-neutral-800">
          <nav className="flex gap-6">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/safety" className="hover:underline">
              Safety
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
