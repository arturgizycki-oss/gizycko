import { cache } from "react";
import { prisma } from "./prisma";

/** Ids of users who accepted a friendship with `userId`, in either direction. */
export const friendIds = cache(async (userId: string): Promise<string[]> => {
  const rows = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
});

/** Ids this user should never see: anyone they blocked, and anyone who blocked them. */
export const hiddenUserIds = cache(async (userId: string): Promise<string[]> => {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });

  return rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId));
});

/** Ids of users already matched with `userId` (active matches only). */
export const matchedUserIds = cache(async (userId: string): Promise<string[]> => {
  const rows = await prisma.match.findMany({
    where: {
      unmatchedAt: null,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: { userAId: true, userBId: true },
  });

  return rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId));
});

/**
 * Friends the two people have in common, with the viewer's own blocks removed.
 * Shown on a profile as the honest answer to "do we know any of the same people".
 */
export async function mutualFriendIds(
  viewerId: string,
  otherId: string,
): Promise<string[]> {
  const [mine, theirs, hidden] = await Promise.all([
    friendIds(viewerId),
    friendIds(otherId),
    hiddenUserIds(viewerId),
  ]);

  const theirSet = new Set(theirs);
  return mine.filter((id) => theirSet.has(id) && !hidden.includes(id));
}
