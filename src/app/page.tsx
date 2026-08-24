import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PhotoPlaceholder } from "@/components/avatar";

const SHOWCASE = [
  { name: "Kasia W", line: "Photographer · Kraków", rotate: "-6deg", offset: "0" },
  { name: "Marek D", line: "Developer · Warszawa", rotate: "3deg", offset: "2.5rem" },
  { name: "Ola P", line: "Climber · Gdańsk", rotate: "-2deg", offset: "5rem" },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/feed");

  return (
    <main className="relative min-h-dvh overflow-hidden bg-white dark:bg-neutral-950">
      {/* Background wash — pure CSS so there is nothing to download. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(244,63,94,0.20),transparent_60%),radial-gradient(50%_45%_at_85%_10%,rgba(251,146,60,0.18),transparent_60%),radial-gradient(45%_45%_at_60%_100%,rgba(168,85,247,0.16),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.18] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px] text-neutral-400"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <span className="text-lg font-semibold tracking-tight">gizycko</span>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-3 py-1 text-xs font-medium text-rose-700 backdrop-blur dark:border-rose-900 dark:bg-neutral-900/70 dark:text-rose-300">
              <span className="size-1.5 rounded-full bg-rose-500" />
              Now open in Poland
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Meet people nearby.
              <br />
              <span className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
                Stay for the community.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg text-neutral-600 dark:text-neutral-400">
              A dating app with a real social side — match, chat, and share what
              you are up to with the people you actually know.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700"
              >
                Create an account
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-neutral-300 bg-white/60 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white dark:border-neutral-700 dark:bg-neutral-900/60 dark:hover:bg-neutral-900"
              >
                I already have one
              </Link>
            </div>

            <p className="mt-8 text-sm text-neutral-500">
              18+ only. Be kind — every profile is a real person.
            </p>
          </div>

          {/* Fan of profile cards. Each one is generated, so no stock photos. */}
          <div className="relative hidden h-[26rem] lg:block">
            {SHOWCASE.map((person, index) => (
              <article
                key={person.name}
                style={{
                  transform: `rotate(${person.rotate}) translateY(${person.offset})`,
                  left: `${index * 5.5}rem`,
                  zIndex: index,
                }}
                className="absolute top-0 w-56 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <PhotoPlaceholder name={person.name} className="aspect-[4/5] w-full" />
                <div className="p-3">
                  <p className="text-sm font-semibold">{person.name}</p>
                  <p className="text-xs text-neutral-500">{person.line}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 pb-12 sm:grid-cols-3">
          {[
            {
              title: "Match honestly",
              body: "Preferences, age range, and distance you actually control.",
            },
            {
              title: "Talk properly",
              body: "Every match gets a private conversation. No paywall to reply.",
            },
            {
              title: "Stay safe",
              body: "Block and report from any profile, post, or message.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-neutral-200 bg-white/70 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70"
            >
              <h2 className="text-sm font-semibold">{feature.title}</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {feature.body}
              </p>
            </div>
          ))}
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
