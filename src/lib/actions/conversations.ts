"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { orderPair } from "@/lib/matching";

/**
 * Open the conversation with someone, creating it if this is the first time.
 *
 * A Match row is the conversation container. Two friends who never swiped on
 * each other still get one, marked FRIEND so it stays out of the Matches list
 * while appearing in Messages like any other thread.
 */
export async function openConversation(otherUserId: string) {
  const session = await requireSession();
  const me = session.user.id;

  if (otherUserId === me) redirect("/messages");

  // A block in either direction means no conversation.
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: me, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: me },
      ],
    },
    select: { id: true },
  });
  if (blocked) redirect("/messages");

  const [userAId, userBId] = orderPair(me, otherUserId);

  const existing = await prisma.match.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    select: { id: true, unmatchedAt: true },
  });

  if (existing) {
    // Reopen a thread that was closed, rather than stranding the history.
    if (existing.unmatchedAt) {
      await prisma.match.update({
        where: { id: existing.id },
        data: { unmatchedAt: null, unmatchedById: null },
      });
    }
    redirect(`/matches/${existing.id}`);
  }

  // Only people already connected may start a conversation out of nowhere.
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: me, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: me },
      ],
    },
    select: { id: true },
  });
  if (!friendship) redirect(`/u/${otherUserId}`);

  const created = await prisma.match.create({
    data: { userAId, userBId, origin: "FRIEND" },
    select: { id: true },
  });

  redirect(`/matches/${created.id}`);
}
