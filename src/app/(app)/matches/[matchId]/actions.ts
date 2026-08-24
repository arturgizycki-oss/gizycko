"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type MessageState = { error?: string; submissionId?: string };

/** Load a match the signed-in user is actually part of, or null. */
async function memberMatch(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, userAId: true, userBId: true, unmatchedAt: true },
  });

  if (!match) return null;
  if (match.userAId !== userId && match.userBId !== userId) return null;
  return match;
}

const messageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export async function sendMessage(
  matchId: string,
  _prev: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const session = await requireSession();
  const match = await memberMatch(matchId, session.user.id);

  if (!match) return { error: "This conversation is not available." };
  if (match.unmatchedAt) return { error: "You are no longer matched." };

  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: "Write something first." };

  const otherId = match.userAId === session.user.id ? match.userBId : match.userAId;

  // A block in either direction closes the conversation.
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: session.user.id, blockedId: otherId },
        { blockerId: otherId, blockedId: session.user.id },
      ],
    },
    select: { id: true },
  });
  if (blocked) return { error: "You cannot message this person." };

  await prisma.$transaction([
    prisma.message.create({
      data: { matchId, senderId: session.user.id, body: parsed.data.body },
    }),
    prisma.match.update({
      where: { id: matchId },
      data: { lastMessageAt: new Date() },
    }),
    prisma.notification.create({
      data: { userId: otherId, type: "MESSAGE", actorId: session.user.id, entityId: matchId },
    }),
  ]);

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/messages");
  // A fresh id tells the composer this send landed, so it can clear itself.
  return { submissionId: randomUUID() };
}

export async function markRead(matchId: string) {
  const session = await requireSession();
  const match = await memberMatch(matchId, session.user.id);
  if (!match) return;

  await prisma.message.updateMany({
    where: { matchId, senderId: { not: session.user.id }, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function unmatch(matchId: string) {
  const session = await requireSession();
  const match = await memberMatch(matchId, session.user.id);
  if (!match) return;

  await prisma.match.update({
    where: { id: matchId },
    data: { unmatchedAt: new Date(), unmatchedById: session.user.id },
  });

  revalidatePath("/matches");
  redirect("/matches");
}
