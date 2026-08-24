import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/avatar";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" },
  { href: "/friends", label: "Friends" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const unread = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  return (
    <div className="relative min-h-dvh bg-neutral-50 dark:bg-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(45%_35%_at_50%_0%,rgba(244,63,94,0.10),transparent_60%)]"
      />

      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
          <Link href="/feed" className="font-semibold tracking-tight">
            gizycko
          </Link>

          <nav className="flex flex-1 gap-4 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href="/notifications" className="relative" aria-label="Notifications">
            <span className="text-lg leading-none">🔔</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <Link href="/profile" aria-label="Your profile">
            <Avatar name={session.user.name} src={session.user.image} size={30} />
          </Link>

          <SignOutButton />
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
