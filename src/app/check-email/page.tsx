import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTranslator } from "@/lib/i18n";
import { Brand } from "@/components/brand";
import { PageBackdrop } from "@/components/page-backdrop";
import { ChevronLeftIcon } from "@/components/icons";
import { ResendButton } from "./resend-button";
import loginBackground from "@/assets/login.jpg";

export const metadata = { title: "Check your inbox" };

/**
 * Shown straight after signing up.
 *
 * Its own route rather than a panel on the sign-up form, so it survives a
 * reload and can be linked to. There is no session to read the address from -
 * an unconfirmed account cannot sign in - so it arrives as a search param.
 */
export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  // Anybody already signed in has confirmed their address already.
  if (await getSession()) redirect("/feed");

  const t = await getTranslator();
  const { email } = await searchParams;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
      <PageBackdrop image={loginBackground} scrim="light" />
      <Brand href="/" size={44} className="relative mb-8 text-lg" />

      <div className="card-glass relative w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("auth.checkInbox")}
        </h1>

        {email && (
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            {t("auth.sentTo")} <strong className="break-all">{email}</strong>
          </p>
        )}

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {t("auth.confirmFirst")}
        </p>

        <Link href="/sign-in" className="btn btn-secondary btn-lg mt-6 w-full">
          <ChevronLeftIcon className="size-4" />
          {t("auth.backToSignIn")}
        </Link>

        {email && (
          <p className="mt-4 text-center text-xs text-neutral-500">
            <ResendButton email={email} />
          </p>
        )}
      </div>
    </main>
  );
}
