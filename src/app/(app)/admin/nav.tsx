"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/music", label: "Music" },
  { href: "/admin/video", label: "Video" },
  { href: "/admin/content", label: "Content" },
];

/**
 * The admin sidebar.
 *
 * Overview matches only itself; every other entry also claims its nested
 * pages, so a member's detail page keeps Members highlighted.
 */
export function AdminNav({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col">
      {SECTIONS.map((section) => {
        const active = section.exact
          ? pathname === section.href
          : pathname === section.href ||
            pathname.startsWith(`${section.href}/`);

        const count = counts[section.label];

        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className="gh-nav-item shrink-0"
          >
            <span className="flex-1 whitespace-nowrap">{section.label}</span>
            {count !== undefined && count > 0 && (
              <span className="gh-label">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
