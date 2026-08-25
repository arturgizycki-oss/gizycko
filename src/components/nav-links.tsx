"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChatIcon,
  CompassIcon,
  GroupIcon,
  HeartIcon,
  HomeIcon,
  UsersIcon,
} from "./icons";

const NAV = [
  { href: "/feed", key: "feed", Icon: HomeIcon, badge: false },
  { href: "/discover", key: "discover", Icon: CompassIcon, badge: false },
  { href: "/matches", key: "matches", Icon: HeartIcon, badge: false },
  { href: "/messages", key: "messages", Icon: ChatIcon, badge: true },
  { href: "/friends", key: "friends", Icon: UsersIcon, badge: false },
  { href: "/groups", key: "groups", Icon: GroupIcon, badge: false },
] as const;

/** Translated on the server; these components only render what they are given. */
export type NavLabels = Record<string, string>;

/**
 * A tab counts as active on its own page and on anything nested under it, so
 * reading a conversation at /matches/<id> still highlights Matches.
 */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Badge({ count, onBrand }: { count: number; onBrand: boolean }) {
  if (count === 0) return null;

  return (
    <span
      className={`absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${
        onBrand ? "bg-white text-brand-700" : "bg-brand-600 text-white"
      }`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * The labelled row inside the header.
 *
 * Six words plus a logo, a bell, and an avatar do not fit a phone, so below
 * `sm` this collapses to nothing and `BottomNav` takes over.
 */
export function NavLinks({
  unreadMessages,
  labels,
}: {
  unreadMessages: number;
  labels: NavLabels;
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden flex-1 items-center gap-1 text-sm sm:flex">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            /*
             * Geometry is identical for every tab - same padding, same font
             * weight - so only colour changes when the active tab moves.
             */
            className={`relative rounded-full px-3 py-1.5 font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white"
                : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
            }`}
          >
            {labels[item.key] ?? item.key}
            {item.badge && <Badge count={unreadMessages} onBrand={active} />}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * The phone navigation: a bar fixed along the bottom, where a thumb reaches.
 *
 * This must be rendered OUTSIDE the header. The header carries `backdrop-blur`,
 * and an element with a backdrop-filter becomes the containing block for its
 * fixed descendants - a bar nested in there would anchor to the bottom of the
 * header and cover the bell and avatar instead of sitting on the viewport.
 */
export function BottomNav({
  unreadMessages,
  labels,
}: {
  unreadMessages: number;
  labels: NavLabels;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_92%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-brand-600" : "text-[var(--ink-muted)]"
                }`}
              >
                <span className="relative">
                  <item.Icon className="size-5" />
                  {item.badge && (
                    <Badge count={unreadMessages} onBrand={false} />
                  )}
                </span>
                <span className="w-full truncate text-center">
                  {labels[item.key] ?? item.key}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
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
