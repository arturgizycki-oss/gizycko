import { prisma } from "./prisma";
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
    await prisma.notification.createMany({
      data: [
        { userId: fromUserId, type: "MATCH", actorId: toUserId },
        { userId: toUserId, type: "MATCH", actorId: fromUserId },
      ],
    });
  }

  return { matched: true, matchId: match.id };
}
