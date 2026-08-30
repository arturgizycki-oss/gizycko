"use client";

import { usePathname } from "next/navigation";
import { PageBackdrop } from "./page-backdrop";
import dashboardBackground from "@/assets/dashboard.jpg";
import friendBackground from "@/assets/friend.jpg";
import groupBackground from "@/assets/group.jpg";
import discoverBackground from "@/assets/discover.jpg";
import matchesBackground from "@/assets/matches.jpg";
import notificationsBackground from "@/assets/notifications.jpg";
import profileBackground from "@/assets/profile.jpg";
import messageBackground from "@/assets/message.jpg";

/** Sections with a photograph of their own; everything else uses the default. */
const BY_SECTION = [
  { path: "/discover", image: discoverBackground },
  { path: "/profile", image: profileBackground },
  { path: "/notifications", image: notificationsBackground },
  { path: "/messages", image: messageBackground },
  { path: "/matches", image: matchesBackground },
  { path: "/groups", image: groupBackground },
  { path: "/friends", image: friendBackground },
];

/**
 * The photograph behind the signed-in app, chosen by where you are.
 *
 * One backdrop that swaps its image, rather than a second one layered over the
 * first from a nested layout: two stacked backdrops would both download, and
 * which appeared on top would depend on document order rather than intent.
 */
export function AppBackdrop() {
  const pathname = usePathname();

  // A section owns its nested pages too, so /friends and /groups/<id> match.
  const section = BY_SECTION.find(
    (entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`),
  );

  return (
    <PageBackdrop image={section?.image ?? dashboardBackground} scrim="heavy" />
  );
}
