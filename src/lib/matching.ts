import { prisma } from "./prisma";
import { notify, notifyAll } from "./notify";
import type { SwipeDirection } from "@/generated/prisma/enums";

/** Order a pair so the same two users always map to the same Match row. */
export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export type SwipeOutcome = { matched: boolean; matchId: string | null };

/**
 * Record a swipe and create the Match when the other side already liked back.
 * Pure data logic, so it can be exercised outside a request context.
 */
export async function recordSwipe(
  fromUserId: string,
  toUserId: string,
  direction: SwipeDirection,
): Promise<SwipeOutcome> {
  if (fromUserId === toUserId) return { matched: false, matchId: null };

  await prisma.swipe.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    create: { fromUserId, toUserId, direction },
    update: { direction },
  });

  if (direction === "PASS") return { matched: false, matchId: null };

  const reciprocal = await prisma.swipe.findUnique({
    where: {
      fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId },
    },
    select: { direction: true },
  });

  if (!reciprocal || reciprocal.direction === "PASS") {
    await notifyOfLike(fromUserId, toUserId);
    return { matched: false, matchId: null };
  }

  const [userAId, userBId] = orderPair(fromUserId, toUserId);

  const existing = await prisma.match.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    select: { id: true, unmatchedAt: true },
  });

  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: { unmatchedAt: null, unmatchedById: null },
  });

  // Notify only when the match is genuinely new, so re-swiping stays silent.
  if (!existing || existing.unmatchedAt !== null) {
    await notifyAll([
      { userId: fromUserId, type: "MATCH", actorId: toUserId },
      { userId: toUserId, type: "MATCH", actorId: fromUserId },
    ]);

    /*
     * Clear the earlier "liked your profile" between these two.
     *
     * Whoever swiped first was announced as a like, and that line is now both
     * redundant and behind the times - it would sit in the list under a match
     * with the same person, still inviting them to go and look.
     */
    await prisma.notification.deleteMany({
      where: {
        type: "PROFILE_LIKE",
        OR: [
          { userId: fromUserId, actorId: toUserId },
          { userId: toUserId, actorId: fromUserId },
        ],
      },
    });
  }

  return { matched: true, matchId: match.id };
}

/**
 * Tell somebody they have been liked, when it did not make a match.
 *
 * Without this a one-sided like is silent, and two people who like each other
 * days apart never find out unless both happen to swipe. On a small site that
 * is the difference between a place with people in it and an empty room: the
 * notification is what sends somebody back to a profile to like in return.
 *
 * Once per pair. Somebody flipping between like and pass should not ring a
 * bell each time, and a second announcement carries no news anyway.
 */
async function notifyOfLike(
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  const [blocked, already] = await Promise.all([
    prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: fromUserId, blockedId: toUserId },
          { blockerId: toUserId, blockedId: fromUserId },
        ],
      },
      select: { id: true },
    }),
    prisma.notification.findFirst({
      where: { userId: toUserId, actorId: fromUserId, type: "PROFILE_LIKE" },
      select: { id: true },
    }),
  ]);

  // Discover hides a blocked member, so this only catches a hand-made request -
  // but a block that still lets someone tap you on the shoulder is no block.
  if (blocked || already) return;

  await notify({
    userId: toUserId,
    type: "PROFILE_LIKE",
    actorId: fromUserId,
  });
}
