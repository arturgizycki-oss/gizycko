"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "./avatar";
import { signOut } from "@/lib/auth-client";

const ITEMS = [
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/help", label: "Help", icon: "❓" },
] as const;

/**
 * Avatar button that opens the account menu. Replaces a permanently visible
 * Sign out, which is a destructive action that does not deserve top billing.
 */
export function UserMenu({
  name,
  photo,
}: {
  name: string;
  photo: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClickAway(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickAway);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAway);
    };
  }, [open]);

  async function onSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Your account"
        className={
          open
            ? "block rounded-full ring-2 ring-brand-500 ring-offset-2 ring-offset-[var(--surface)]"
            : "block rounded-full"
        }
      >
        <Avatar name={name} src={photo} size={30} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="card absolute right-0 z-30 mt-2 w-52 overflow-hidden p-1"
        >
          <p className="truncate px-3 py-2 text-sm font-medium">{name}</p>
          <div className="my-1 border-t border-[var(--line)]" />

          {ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-[var(--surface-muted)] font-medium"
                    : "hover:bg-[var(--surface-muted)]"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <div className="my-1 border-t border-[var(--line)]" />

          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={onSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/30"
          >
            <span aria-hidden>↩</span>
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
