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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-6 py-12 dark:bg-neutral-950">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight">
        gizycko
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {children}
      </div>
    </main>
  );
}
