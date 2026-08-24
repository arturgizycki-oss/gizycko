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

/**
 * Add or remove one emoji on a message. Tapping the same emoji again removes
 * it, which is how every chat app behaves.
 */
export async function toggleMessageReaction(messageId: string, emoji: string) {
  const session = await requireSession();
  const me = session.user.id;

  // Keep it to a single grapheme-ish token; the column is small on purpose.
  const trimmed = emoji.trim().slice(0, 24);
  if (!trimmed) return;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { matchId: true, deletedAt: true },
  });
  if (!message || message.deletedAt) return;

  // Only someone in the conversation may react to it.
  if (!(await memberMatch(message.matchId, me))) return;

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: { messageId, userId: me, emoji: trimmed },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({
      data: { messageId, userId: me, emoji: trimmed },
    });
  }

  revalidatePath(`/matches/${message.matchId}`);
}
