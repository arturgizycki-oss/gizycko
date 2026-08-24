import { cache } from "react";
import { prisma } from "./prisma";
import { hiddenUserIds } from "./social";

/**
 * How many people follow this user, and how many they follow.
 *
 * Counts are raw: hiding people the *viewer* has blocked would make the same
 * profile show a different follower count to different people, which reads as a
 * bug. The lists below are filtered instead.
 */
export const followCounts = cache(async (userId: string) => {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return { followers, following };
});

/** Whether `viewerId` follows `userId`. */
export const isFollowing = cache(async (viewerId: string, userId: string) => {
  if (viewerId === userId) return false;

  const row = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
    select: { id: true },
  });

  return row !== null;
});

const PROFILE_AVATAR = {
  displayName: true,
  photos: {
    where: { isPrimary: true, moderation: { not: "REJECTED" as const } },
    select: { url: true },
    take: 1,
  },
};

export type FollowPerson = {
  id: string;
  name: string;
  photo: string | null;
};

/** People following `userId`, minus anyone the viewer cannot see. */
export async function followersOf(
  userId: string,
  viewerId: string,
  take = 30,
): Promise<FollowPerson[]> {
  const hidden = await hiddenUserIds(viewerId);

  const rows = await prisma.follow.findMany({
    where: { followingId: userId, followerId: { notIn: hidden } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      follower: {
        select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
      },
    },
  });

  return rows.map(({ follower }) => ({
    id: follower.id,
    name: follower.profile?.displayName ?? follower.name,
    photo: follower.profile?.photos[0]?.url ?? null,
  }));
}

/** People `userId` follows, minus anyone the viewer cannot see. */
export async function followingOf(
  userId: string,
  viewerId: string,
  take = 30,
): Promise<FollowPerson[]> {
  const hidden = await hiddenUserIds(viewerId);

  const rows = await prisma.follow.findMany({
    where: { followerId: userId, followingId: { notIn: hidden } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      following: {
        select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
      },
    },
  });

  return rows.map(({ following }) => ({
    id: following.id,
    name: following.profile?.displayName ?? following.name,
    photo: following.profile?.photos[0]?.url ?? null,
  }));
}
