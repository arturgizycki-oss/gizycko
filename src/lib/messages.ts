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

/** Every conversation this user is part of, newest activity first. */
export async function listConversations(userId: string): Promise<Conversation[]> {
  const profileSelect = {
    displayName: true,
    photos: {
      where: { isPrimary: true, moderation: { not: "REJECTED" as const } },
      select: { url: true },
      take: 1,
    },
  };

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, name: true, profile: { select: profileSelect } } },
      userB: { select: { id: true, name: true, profile: { select: profileSelect } } },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
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

  return matches
    .map((match): Conversation => {
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
    })
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}
