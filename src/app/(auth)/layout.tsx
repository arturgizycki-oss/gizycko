import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/feed");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-neutral-50 px-6 py-12 dark:bg-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_0%,rgba(244,63,94,0.18),transparent_65%),radial-gradient(45%_40%_at_15%_100%,rgba(251,146,60,0.14),transparent_60%)]"
      />

      <Link
        href="/"
        className="relative mb-8 text-lg font-semibold tracking-tight"
      >
        gizycko
      </Link>

      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white/90 p-8 shadow-xl shadow-neutral-900/5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
        {children}
      </div>

      <p className="relative mt-6 text-xs text-neutral-500">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
