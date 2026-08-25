import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          <ChevronLeftIcon className="size-4" />
          gizycko
        </Link>

        <div
          role="note"
          className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <strong>Draft.</strong> A starting point, not advice, and not reviewed
          by a lawyer. It is written against the GDPR because that is the
          strictest regime this service is likely to meet, but a site open
          worldwide also answers to local law - among others the UK GDPR,
          California&rsquo;s CCPA/CPRA, Brazil&rsquo;s LGPD, and consumer rules
          in every market you accept members from. Have a lawyer review it
          before real people sign up.
        </div>

        <article className="mt-8 space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-neutral-900 dark:[&_h1]:text-neutral-100 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-100 [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </article>

        <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800">
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
