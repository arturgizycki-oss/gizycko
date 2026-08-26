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
 * The profile columns every page can rely on. Photos are deliberately absent:
 * one page in fifteen reads them, and including them meant every request
 * dragged the whole photo table for that member along with it.
 */
const PROFILE_FIELDS = {
  id: true,
  userId: true,
  displayName: true,
  birthDate: true,
  gender: true,
  interestedIn: true,
  bio: true,
  occupation: true,
  city: true,
  minAgePref: true,
  maxAgePref: true,
  maxDistanceKm: true,
  isVisible: true,
  completedAt: true,
  lastActiveAt: true,
} as const;

/**
 * Session plus the member's profile. Sends users without a finished profile to
 * onboarding, so every page behind this can assume a complete profile exists.
 *
 * Cached per request: a page and any component under it share one lookup.
 */
export const requireProfile = cache(async () => {
  const session = await requireSession();

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: PROFILE_FIELDS,
  });

  if (!profile?.completedAt) redirect("/onboarding");

  await touchLastActive(profile.id, profile.lastActiveAt);

  return { session, profile };
});

/** The same, plus the member's photos. Only the profile page needs those. */
export const requireProfileWithPhotos = cache(async () => {
  const { session, profile } = await requireProfile();

  const photos = await prisma.photo.findMany({
    where: { profileId: profile.id },
    orderBy: { position: "asc" },
    select: { id: true, url: true, isPrimary: true, moderation: true },
  });

  return { session, profile, photos };
});

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
