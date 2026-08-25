import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Brand } from "@/components/brand";
import { Avatar } from "@/components/avatar";
import { topFollowed } from "@/lib/follows";
import { PageBackdrop } from "@/components/page-backdrop";
import landingBackground from "@/assets/landing.jpg";
import { getTranslator } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

/** Titles and bodies as keys; the copy itself lives in the dictionaries. */
const FEATURES = [
  { title: "landing.f1", body: "landing.f1b" },
  { title: "landing.f2", body: "landing.f2b" },
  { title: "landing.f3", body: "landing.f3b" },
] as const satisfies readonly { title: MessageKey; body: MessageKey }[];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/feed");

  const t = await getTranslator();

  const ranked = await topFollowed(10);
  // A leaderboard of zeros says nothing good about a new site, so it only
  // appears once somebody is actually being followed.
  const showRanking = ranked.some((member) => member.followers > 0);

  return (
    <main className="relative min-h-dvh">
      {/*
        The photograph carries the page, so the hero is one centred column over
        it rather than text beside a second picture. The scrim is what keeps the
        headline readable - without it the bright sky washes the text out.
      */}
      <PageBackdrop image={landingBackground} scrim="gradient" />

      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between py-6">
          <Brand href="/" size={34} className="text-lg" />
          <Link
            href="/sign-in"
            className="text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            {t("auth.signIn")}
          </Link>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur dark:border-brand-900 dark:bg-neutral-900/70 dark:text-brand-200">
            <span className="size-1.5 rounded-full bg-brand-500" />
            {t("landing.badge")}
          </span>

          <h1 className="mt-6 max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-6xl">
            {t("landing.headline")}
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              {t("landing.headline2")}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-[var(--ink-muted)]">
            {t("landing.intro")}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/sign-up" className="btn btn-primary btn-lg">
              {t("landing.create")}
            </Link>
            <Link href="/sign-in" className="btn btn-secondary btn-lg">
              {t("landing.have")}
            </Link>
          </div>

          <p className="mt-8 text-sm text-[var(--ink-muted)]">
            {t("landing.note")}
          </p>
        </section>

        {showRanking && (
          <section className="pb-10">
            <h2 className="text-sm font-semibold text-[var(--ink-muted)]">
              {t("landing.mostFollowed")}
            </h2>

            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {ranked.map((member) => (
                <li
                  key={member.id}
                  className="card-glass flex items-center gap-3 p-3"
                >
                  <span className="w-6 shrink-0 text-center text-sm font-semibold text-[var(--ink-muted)] tabular-nums">
                    {member.rank}
                  </span>

                  <Avatar name={member.name} src={member.photo} size={44} />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {member.name}
                    </span>
                    <span className="hint block truncate">
                      {[member.occupation, member.city]
                        .filter(Boolean)
                        .join(" · ") || t("landing.onGizycko")}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums">
                      {member.followers}
                    </span>
                    <span className="hint">
                      {member.followers === 1
                        ? t("landing.follower")
                        : t("landing.followers")}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="grid gap-4 pb-12 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card-glass p-4">
              <h2 className="text-sm font-semibold">{t(feature.title)}</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {t(feature.body)}
              </p>
            </div>
          ))}
        </section>

        <footer className="border-t border-[var(--line)] py-6 text-sm text-[var(--ink-muted)]">
          <nav className="flex gap-6">
            <Link href="/terms" className="hover:underline">
              {t("settings.terms")}
            </Link>
            <Link href="/privacy" className="hover:underline">
              {t("settings.privacyPolicy")}
            </Link>
            <Link href="/safety" className="hover:underline">
              {t("settings.safety")}
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
