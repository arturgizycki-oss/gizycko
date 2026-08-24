import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

/**
 * Current session, or null when signed out. Safe to call in any server
 * component.
 *
 * Wrapped in React's cache so the layout and the page it renders share one
 * lookup instead of hitting the database twice for every request.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Session or redirect to sign-in. Use in protected server components and actions. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.bannedAt) redirect("/banned");
  return session;
}

/**
 * Session plus the dating profile. Sends users without a finished profile to
 * onboarding, so every page behind this can assume a complete profile exists.
 */
export async function requireProfile() {
  const session = await requireSession();

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { photos: { orderBy: { position: "asc" } } },
  });

  if (!profile?.completedAt) redirect("/onboarding");

  await touchLastActive(profile.id, profile.lastActiveAt);

  return { session, profile };
}

/** How stale "last active" may get before it is worth another write. */
const ACTIVITY_WINDOW_MS = 10 * 60 * 1000;

/**
 * Keep "last active" honest. It was set at signup and never updated, so every
 * profile claimed the member was last seen the moment they joined. Throttled,
 * so a browsing session costs one update every ten minutes rather than one per
 * page.
 */
async function touchLastActive(profileId: string, lastActiveAt: Date) {
  if (Date.now() - lastActiveAt.getTime() < ACTIVITY_WINDOW_MS) return;

  await prisma.profile.update({
    where: { id: profileId },
    data: { lastActiveAt: new Date() },
  });
}

/** Session for a moderator or admin, or a 404 for everyone else. */
export async function requireModerator() {
  const session = await requireSession();
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    notFound();
  }
  return session;
}
