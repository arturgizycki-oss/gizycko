import { prisma } from "./prisma";

/** Unread messages waiting for this user across every active conversation. */
export function unreadMessageCount(userId: string) {
  return prisma.message.count({
    where: {
      readAt: null,
      deletedAt: null,
      senderId: { not: userId },
      match: {
        unmatchedAt: null,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    },
  });
}

export type Conversation = {
  matchId: string;
  otherUserId: string;
  name: string;
  photo: string | null;
  lastBody: string | null;
  lastAt: Date;
  lastFromMe: boolean;
  unread: number;
  closed: boolean;
};

const PROFILE_AVATAR = {
  displayName: true,
  photos: {
    where: { isPrimary: true, moderation: { not: "REJECTED" as const } },
    select: { url: true },
    take: 1,
  },
};

/**
 * Every conversation this user is part of, newest activity first.
 *
 * Ordered by lastMessageAt, which is indexed for both sides of a match, and
 * capped. It used to read every match ever made and sort them in JavaScript,
 * which is fine at ten conversations and not at a thousand.
 */
export async function listConversations(
  userId: string,
  take = 100,
): Promise<Conversation[]> {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    // lastMessageAt is null until someone speaks; without nulls:"last" a
    // descending sort would float every silent match to the top.
    orderBy: [
      { lastMessageAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take,
    select: {
      id: true,
      userAId: true,
      createdAt: true,
      unmatchedAt: true,
      userA: {
        select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
      },
      userB: {
        select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        // The inbox shows a one-line preview; the media columns are not read.
        select: { body: true, createdAt: true, senderId: true },
      },
      _count: {
        select: {
          messages: {
            where: { readAt: null, deletedAt: null, senderId: { not: userId } },
          },
        },
      },
    },
  });

  return matches.map((match): Conversation => {
    const other = match.userAId === userId ? match.userB : match.userA;
    const last = match.messages[0];

    return {
      matchId: match.id,
      otherUserId: other.id,
      name: other.profile?.displayName ?? other.name,
      photo: other.profile?.photos[0]?.url ?? null,
      lastBody: last?.body ?? null,
      lastAt: last?.createdAt ?? match.createdAt,
      lastFromMe: last ? last.senderId === userId : false,
      unread: match._count.messages,
      closed: match.unmatchedAt !== null,
    };
  });
}
