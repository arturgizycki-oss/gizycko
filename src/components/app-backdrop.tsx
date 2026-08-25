"use client";

import { usePathname } from "next/navigation";
import { PageBackdrop } from "./page-backdrop";
import dashboardBackground from "@/assets/dashboard.jpg";
import groupBackground from "@/assets/group.jpg";

/**
 * The photograph behind the signed-in app, chosen by where you are.
 *
 * One backdrop that swaps its image, rather than a second one layered over the
 * first from a nested layout: two stacked backdrops would both download, and
 * which appeared on top would depend on document order rather than intent.
 */
export function AppBackdrop() {
  const pathname = usePathname();
  const inGroups = pathname === "/groups" || pathname.startsWith("/groups/");

  return (
    <PageBackdrop
      image={inGroups ? groupBackground : dashboardBackground}
      scrim="heavy"
    />
  );
}
