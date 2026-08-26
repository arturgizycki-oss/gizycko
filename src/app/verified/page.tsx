import Link from "next/link";
import { getSession } from "@/lib/session";
import { getTranslator } from "@/lib/i18n";
import { Brand } from "@/components/brand";
import { PageBackdrop } from "@/components/page-backdrop";
import { CheckIcon } from "@/components/icons";
import loginBackground from "@/assets/login.jpg";

export const metadata = { title: "Email confirmed" };

/**
 * Where the link in the confirmation email lands.
 *
 * Better Auth signs the member in as it verifies, so the useful thing here is
 * not another form but a moment of "that worked" and the way onward. Without
 * it the link dropped somebody on the marketing page they had signed up from,
 * signed in but with nothing saying the address had been confirmed - which
 * reads as the link having failed.
 *
 * Written for both cases. Somebody who opens the link twice, or on a phone
 * that is not signed in, still gets an answer rather than an error.
 */
export default async function VerifiedPage() {
  const [session, t] = await Promise.all([getSession(), getTranslator()]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
      <PageBackdrop image={loginBackground} scrim="light" />
      <Brand href="/" size={44} className="relative mb-8 text-lg" />

      <div className="card-glass relative w-full max-w-sm p-6 text-center sm:p-8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckIcon className="size-6" />
        </span>

        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          {t("auth.verifiedTitle")}
        </h1>

        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          {session ? t("auth.verifiedSignedIn") : t("auth.verifiedNow")}
        </p>

        <Link
          href={session ? "/onboarding" : "/sign-in"}
          className="btn btn-primary btn-lg mt-6 w-full justify-center"
        >
          {session ? t("auth.verifiedContinue") : t("auth.signIn")}
        </Link>
      </div>
    </main>
  );
}
