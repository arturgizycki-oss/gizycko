"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkContent } from "@/lib/content-policy";
import { checkUploadedImage } from "@/lib/image";
import { checkUploadedAudio, titleFromFileName } from "@/lib/audio";
import { checkUploadedVideo } from "@/lib/video";
import { checkUploadedVoice } from "@/lib/voice";
import { mediaUrl, putObject } from "@/lib/storage";
import { verifyUploaded } from "@/lib/uploads";
import { isMediaKind } from "@/lib/media-kinds";
import { emailAboutMessage } from "@/lib/message-email";
import { pushToUser } from "@/lib/realtime";
import { worthNotifying } from "@/lib/message-notify";

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

/** The other half of a conversation. */
function otherSide(
  match: { userAId: string; userBId: string },
  userId: string,
): string {
  return match.userAId === userId ? match.userBId : match.userAId;
}

const messageSchema = z.object({
  body: z.string().trim().max(4000),
});

/**
 * The message being answered, if it is real and belongs to this conversation.
 *
 * Checked rather than trusted: a crafted form could otherwise point a reply at
 * a message in somebody else's chat, and the quoted text would then be shown
 * to people who were never meant to see it.
 */
async function replyTarget(
  matchId: string,
  raw: FormDataEntryValue | null,
): Promise<string | null> {
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id) return null;

  const found = await prisma.message.findFirst({
    where: { id, matchId, deletedAt: null },
    select: { id: true },
  });

  return found?.id ?? null;
}

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
): Promise<
  { ok: true; attachment: Attachment } | { ok: false; error: string }
> {
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

  const voiceEntry = formData.get("voice");
  const voice =
    voiceEntry instanceof File && voiceEntry.size > 0 ? voiceEntry : null;

  const replyToId = await replyTarget(matchId, formData.get("replyTo"));

  if (parsed.data.body.length === 0 && !file && !voice) {
    return {
      error: "Write something, or attach a photo, video, song, or recording.",
    };
  }

  const allowed = checkContent(parsed.data.body);
  if (!allowed.ok) return { error: allowed.message };

  const otherId = otherSide(match, session.user.id);

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

  // A recording arrives in its own field, because a WebM voice note is
  // byte-identical to a WebM video and only the field says which it is.
  const uploadedKey = formData.get("attachmentKey");
  const uploadedKind = formData.get("attachmentKind");

  if (typeof uploadedKey === "string" && uploadedKey.length > 0) {
    // Put in the bucket by the browser, because a serverless request body
    // cannot carry a video. Verified before it is attached to anything.
    const kind = isMediaKind(uploadedKind) ? uploadedKind : "image";
    const verified = await verifyUploaded(uploadedKey, kind, session.user.id);
    if (!verified.ok) return { error: verified.error };

    attachment = {
      key: uploadedKey,
      bytes: Buffer.alloc(0),
      type: verified.media.contentType,
      kind: kind === "video" ? "VIDEO" : kind === "image" ? "IMAGE" : "AUDIO",
      name:
        kind === "voice"
          ? "Voice note"
          : String(formData.get("attachmentName") ?? "Attachment"),
    };
  } else if (voice) {
    const checked = await checkUploadedVoice(voice);
    if (!checked.ok) return { error: checked.error };
    attachment = {
      key: `chat-voice/${session.user.id}/${randomUUID()}${checked.kind.extension}`,
      bytes: checked.bytes,
      type: checked.kind.contentType,
      kind: "AUDIO",
      name: "Voice note",
    };
    await putObject(attachment.key, attachment.bytes);
  } else if (file) {
    const result = await readAttachment(file, session.user.id);
    if (!result.ok) return { error: result.error };
    attachment = result.attachment;
    await putObject(attachment.key, attachment.bytes);
  }

  const announce = await worthNotifying(matchId, session.user.id, otherId);

  await prisma.$transaction([
    prisma.message.create({
      data: {
        matchId,
        senderId: session.user.id,
        body: parsed.data.body,
        replyToId,
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
    /*
     * Not notify(): this has to stay inside the transaction, so that a message
     * and the notification about it either both exist or neither does. The
     * push it would otherwise have sent is in the `after` block below.
     */
    ...(announce
      ? [
          prisma.notification.create({
            data: {
              userId: otherId,
              type: "MESSAGE",
              actorId: session.user.id,
              entityId: matchId,
            },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/messages");

  /*
   * Nudge the other person by email, after this reply has gone back.
   *
   * A notification inside the site only reaches somebody who returns of their
   * own accord, which is why a message here could sit unseen for a week. This
   * decides for itself whether to send - see emailAboutMessage - and it runs in
   * `after` so a slow mail provider never delays the send or fails it.
   */
  after(async () => {
    // The push lands in the other window immediately; the email decides for
    // itself whether this is somebody who is not there to see it.
    await pushToUser(otherId, "message");
    await emailAboutMessage(otherId, session.user.name, matchId);
  });

  // A fresh id tells the composer this send landed, so it can clear itself.
  return { submissionId: randomUUID() };
}

/** How long after sending a message may still be edited. */
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Change the text of your own message.
 *
 * Only your own, only within a day, and only messages that have text: editing
 * an attachment would mean swapping the file under a message somebody has
 * already read. The edit is stamped, so the other person can see it changed.
 */
export async function editMessage(
  messageId: string,
  body: string,
): Promise<{ error?: string }> {
  const session = await requireSession();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      matchId: true,
      senderId: true,
      body: true,
      createdAt: true,
      deletedAt: true,
    },
  });

  if (!message || message.senderId !== session.user.id || message.deletedAt) {
    return { error: "That message cannot be edited." };
  }

  if (message.body.length === 0) {
    return { error: "That message cannot be edited." };
  }

  if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS) {
    return { error: "That message is too old to edit." };
  }

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) return { error: "That message is too long." };
  if (parsed.data.body.length === 0) {
    return { error: "An edited message cannot be empty." };
  }

  const allowed = checkContent(parsed.data.body);
  if (!allowed.ok) return { error: allowed.message };

  if (parsed.data.body === message.body) return {};

  await prisma.message.update({
    where: { id: messageId },
    data: { body: parsed.data.body, editedAt: new Date() },
  });

  revalidatePath(`/matches/${message.matchId}`);
  revalidatePath("/messages");
  return {};
}

export async function markRead(matchId: string) {
  const session = await requireSession();
  const match = await memberMatch(matchId, session.user.id);
  if (!match) return;

  const [messages, notifications] = await prisma.$transaction([
    prisma.message.updateMany({
      where: { matchId, senderId: { not: session.user.id }, readAt: null },
      data: { readAt: new Date() },
    }),
    /*
     * Reading the conversation is what clears its notifications.
     *
     * They used to survive it, so opening a chat left the bell still claiming
     * there was something to see, and the only way to clear it was to visit the
     * notifications page and read a line about a message already read.
     */
    prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        type: "MESSAGE",
        entityId: matchId,
        readAt: null,
      },
      data: { readAt: new Date() },
    }),
  ]);

  if (notifications.count > 0) {
    // The bell is stale until this lands.
    await pushToUser(session.user.id, "notification");
  }

  if (messages.count > 0) {
    // The sender's ticks are stale until this lands.
    await pushToUser(otherSide(match, session.user.id), "message");
  }
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
