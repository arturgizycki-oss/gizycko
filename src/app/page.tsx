import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { GIZYCKO_PHOTOS } from "@/lib/photo-credits";
import { PhotoCreditLine } from "@/components/photo-backdrop";
import { Brand } from "@/components/brand";

const SHOWCASE = [
  { name: "Kasia", age: 28, line: "Photographer · Kraków", src: "/demo/kasia.jpg" },
  { name: "Marek", age: 33, line: "Developer · Warszawa", src: "/demo/marek.jpg" },
  { name: "Ania", age: 31, line: "Climber · Gdańsk", src: "/demo/ania.jpg" },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/feed");

  return (
    <main className="relative min-h-dvh overflow-hidden bg-white dark:bg-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(244,63,94,0.18),transparent_60%),radial-gradient(50%_45%_at_85%_10%,rgba(251,146,60,0.16),transparent_60%)]"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <Brand href="/" size={34} className="text-lg" />
          <Link
            href="/sign-in"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur dark:border-brand-900 dark:bg-neutral-900/70 dark:text-brand-200">
              <span className="size-1.5 rounded-full bg-brand-500" />
              Now open in Poland
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Meet people nearby.
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
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
                className="btn btn-primary btn-lg"
              >
                Create an account
              </Link>
              <Link
                href="/sign-in"
                className="btn btn-secondary btn-lg"
              >
                I already have one
              </Link>
            </div>

            <p className="mt-8 text-sm text-neutral-500">
              18+ only. Be kind — every profile is a real person.
            </p>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl shadow-neutral-900/20 sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src={GIZYCKO_PHOTOS.bridge.src}
                alt={GIZYCKO_PHOTOS.bridge.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-neutral-950/10 to-transparent"
              />
              <p className="absolute right-6 bottom-8 left-6 text-lg font-semibold text-white">
                Someone in Giżycko is free this weekend.
              </p>
              <PhotoCreditLine photo={GIZYCKO_PHOTOS.bridge} />
            </div>

            {/* Overlapping profile card, the way a match actually looks. */}
            <article className="absolute -bottom-6 -left-4 hidden w-48 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-xl shadow-neutral-900/20 sm:block dark:border-neutral-800 dark:bg-neutral-900">
              <div className="relative aspect-square">
                <Image
                  src={SHOWCASE[0].src}
                  alt=""
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold">
                  {SHOWCASE[0].name}, {SHOWCASE[0].age}
                </p>
                <p className="text-xs text-neutral-500">{SHOWCASE[0].line}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="pt-16 pb-10">
          <h2 className="text-sm font-semibold text-neutral-500">
            People already here
          </h2>
          <ul className="mt-4 grid grid-cols-3 gap-4">
            {SHOWCASE.map((person) => (
              <li
                key={person.name}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={person.src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 33vw, 200px"
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">
                    {person.name}, {person.age}
                  </p>
                  <p className="text-xs text-neutral-500">{person.line}</p>
                </div>
              </li>
            ))}
          </ul>
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
              className="card-glass p-4"
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
