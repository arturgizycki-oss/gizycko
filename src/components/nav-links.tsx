"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" },
  { href: "/messages", label: "Messages", badge: true },
  { href: "/friends", label: "Friends" },
] as const;

/**
 * A tab counts as active on its own page and on anything nested under it, so
 * reading a conversation at /matches/<id> still highlights Matches.
 */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ unreadMessages }: { unreadMessages: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 items-center gap-1 text-sm">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "relative rounded-full bg-brand-600 px-3 py-1.5 font-semibold text-white"
                : "relative rounded-full px-3 py-1.5 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
            }
          >
            {item.label}

            {"badge" in item && item.badge && unreadMessages > 0 && (
              <span
                className={
                  active
                    ? "absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand-700"
                    : "absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white"
                }
              >
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Marks the notification bell and profile avatar when you are on their page. */
export function NavIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "relative rounded-full ring-2 ring-brand-500 ring-offset-2 ring-offset-[var(--surface)]"
          : "relative rounded-full"
      }
    >
      {children}
    </Link>
  );
}
