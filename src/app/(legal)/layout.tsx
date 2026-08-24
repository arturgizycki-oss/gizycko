import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← gizycko
        </Link>

        <div
          role="note"
          className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <strong>Draft.</strong> This text is a starting point written for a
          Polish/EU dating service. It has not been reviewed by a lawyer. Have a
          Polish lawyer check it before real users sign up.
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
