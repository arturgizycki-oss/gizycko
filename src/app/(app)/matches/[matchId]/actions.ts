"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkUploadedImage } from "@/lib/image";
import { checkUploadedAudio, titleFromFileName } from "@/lib/audio";
import { checkUploadedVideo } from "@/lib/video";
import { mediaUrl, putObject } from "@/lib/storage";

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
  body: z.string().trim().max(4000),
});

type Attachment = {
  key: string;
  bytes: Buffer;
  type: string;
  kind: "IMAGE" | "VIDEO" | "AUDIO";
  name: string;
};

/**
 * Work out what was attached and check it by magic bytes, never by filename or
 * the content type the browser claims. Returns null when nothing was attached.
 */
async function readAttachment(
  file: File,
  userId: string,
): Promise<{ ok: true; attachment: Attachment } | { ok: false; error: string }> {
  const declared = file.type.toLowerCase();

  if (declared.startsWith("video/")) {
    const checked = await checkUploadedVideo(file);
    if (!checked.ok) return { ok: false, error: checked.error };
    return {
      ok: true,
      attachment: {
        key: `chat/${userId}/${randomUUID()}${checked.kind.extension}`,
        bytes: checked.bytes,
        type: checked.kind.contentType,
        kind: "VIDEO",
        name: file.name.slice(0, 200),
      },
    };
  }

  if (declared.startsWith("audio/")) {
    const checked = await checkUploadedAudio(file);
    if (!checked.ok) return { ok: false, error: checked.error };
    return {
      ok: true,
      attachment: {
        key: `chat/${userId}/${randomUUID()}${checked.kind.extension}`,
        bytes: checked.bytes,
        type: checked.kind.contentType,
        kind: "AUDIO",
        name: titleFromFileName(file.name) || "Audio",
      },
    };
  }

  const checked = await checkUploadedImage(file);
  if (!checked.ok) return { ok: false, error: checked.error };
  return {
    ok: true,
    attachment: {
      key: `chat/${userId}/${randomUUID()}${checked.kind.extension}`,
      bytes: checked.bytes,
      type: checked.kind.contentType,
      kind: "IMAGE",
      name: file.name.slice(0, 200),
    },
  };
}

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
  if (!parsed.success) return { error: "That message is too long." };

  const entry = formData.get("attachment");
  const file = entry instanceof File && entry.size > 0 ? entry : null;

  if (parsed.data.body.length === 0 && !file) {
    return { error: "Write something, or attach a photo, video, or song." };
  }

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

  let attachment: Attachment | null = null;
  if (file) {
    const result = await readAttachment(file, session.user.id);
    if (!result.ok) return { error: result.error };
    attachment = result.attachment;
    await putObject(attachment.key, attachment.bytes);
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        matchId,
        senderId: session.user.id,
        body: parsed.data.body,
        mediaUrl: attachment ? mediaUrl(attachment.key) : null,
        mediaType: attachment?.type ?? null,
        mediaKind: attachment?.kind ?? null,
        mediaName: attachment?.name ?? null,
      },
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
