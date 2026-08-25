/**
 * `user.image` is Better Auth's OAuth avatar field and is null for anyone who
 * signed up with email - the picture people actually upload lives in the Photo
 * table. Every avatar in the app should prefer that.
 */

/** Prisma `where` for the one photo that represents a profile. */
export const PRIMARY_PHOTO_WHERE = {
  isPrimary: true,
  moderation: { not: "REJECTED" },
} as const;

/** The primary photo's url, or null when the profile has no usable picture. */
export function photoUrlOf(
  profile: { photos: { url: string }[] } | null | undefined,
): string | null {
  return profile?.photos[0]?.url ?? null;
}
