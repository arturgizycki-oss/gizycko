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

  return { session, profile };
}

/** Session for a moderator or admin, or a 404 for everyone else. */
export async function requireModerator() {
  const session = await requireSession();
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    notFound();
  }
  return session;
}
