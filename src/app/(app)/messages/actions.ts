"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** A match the signed-in user actually belongs to, or null. */
async function memberMatch(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, userAId: true, userBId: true },
  });

  if (!match) return null;
  if (match.userAId !== userId && match.userBId !== userId) return null;
  return match;
}

export async function markConversationRead(matchId: string) {
  const session = await requireSession();
  if (!(await memberMatch(matchId, session.user.id))) return;

  await prisma.message.updateMany({
    where: { matchId, senderId: { not: session.user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/messages");
  revalidatePath("/", "layout");
}

/** Mark the latest incoming message unread again, so it resurfaces. */
export async function markConversationUnread(matchId: string) {
  const session = await requireSession();
  if (!(await memberMatch(matchId, session.user.id))) return;

  const latest = await prisma.message.findFirst({
    where: { matchId, senderId: { not: session.user.id }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!latest) return;

  await prisma.message.update({
    where: { id: latest.id },
    data: { readAt: null },
  });

  revalidatePath("/messages");
  revalidatePath("/", "layout");
}

export async function markAllConversationsRead() {
  const session = await requireSession();
  const me = session.user.id;

  await prisma.message.updateMany({
    where: {
      readAt: null,
      senderId: { not: me },
      match: { unmatchedAt: null, OR: [{ userAId: me }, { userBId: me }] },
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/messages");
  revalidatePath("/", "layout");
}

/**
 * Soft-delete one of your own messages. The row stays so the conversation keeps
 * its shape and any report against it still has something to point at.
 */
export async function deleteMessage(messageId: string) {
  const session = await requireSession();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, matchId: true },
  });

  if (!message || message.senderId !== session.user.id) return;

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), body: "" },
  });

  revalidatePath(`/matches/${message.matchId}`);
  revalidatePath("/messages");
}
