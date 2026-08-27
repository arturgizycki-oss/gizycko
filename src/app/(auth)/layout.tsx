import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthBackdrop } from "@/components/auth-backdrop";
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
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
      <AuthBackdrop />
      <Brand href="/" size={44} className="relative mb-8 text-lg" />

      <div className="card-glass relative w-full max-w-sm p-6 sm:p-8">
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
