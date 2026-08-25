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

export type RankedMember = {
  rank: number;
  id: string;
  name: string;
  photo: string | null;
  city: string | null;
  occupation: string | null;
  followers: number;
};

/**
 * The most-followed members, for the public landing page.
 *
 * Only profiles their owner has set visible in Discover, and only accounts in
 * good standing. That setting is the closest thing to consent we have — see the
 * note in the README about asking for it explicitly before real members arrive.
 */
export async function topFollowed(limit = 10): Promise<RankedMember[]> {
  const users = await prisma.user.findMany({
    where: {
      bannedAt: null,
      profile: { is: { isVisible: true, completedAt: { not: null } } },
      // Somebody with no followers does not belong in "most followed"; without
      // this the list pads itself out with zeros.
      followers: { some: {} },
    },
    orderBy: [{ followers: { _count: "desc" } }],
    take: limit,
    select: {
      id: true,
      name: true,
      profile: {
        select: {
          displayName: true,
          city: true,
          occupation: true,
          photos: {
            where: { isPrimary: true, moderation: { not: "REJECTED" } },
            select: { url: true },
            take: 1,
          },
        },
      },
      _count: { select: { followers: true } },
    },
  });

  return users.map((user, index) => ({
    rank: index + 1,
    id: user.id,
    name: user.profile?.displayName ?? user.name,
    photo: user.profile?.photos[0]?.url ?? null,
    city: user.profile?.city ?? null,
    occupation: user.profile?.occupation ?? null,
    followers: user._count.followers,
  }));
}
