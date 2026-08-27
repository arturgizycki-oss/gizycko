import { prisma } from "./prisma";
import type { ChatMessage } from "@/app/(app)/matches/[matchId]/chat";

/**
 * The messages of one conversation, in the shape the chat draws.
 *
 * Shared by the page and by the endpoint the open chat asks, so the two can
 * never disagree about what a message looks like. That matters more than it
 * sounds: the chat replaces its whole list with what this returns, and a
 * field shaped differently in one place would change how a message renders
 * depending on whether it arrived with the page or after it.
 */

/** How far back a conversation is loaded. */
export const MESSAGE_WINDOW = 200;

const SELECT = {
  id: true,
  body: true,
  createdAt: true,
  senderId: true,
  readAt: true,
  deletedAt: true,
  editedAt: true,
  mediaUrl: true,
  mediaKind: true,
  mediaName: true,
  reactions: { select: { emoji: true, userId: true } },
  replyTo: {
    select: {
      id: true,
      body: true,
      senderId: true,
      deletedAt: true,
      mediaUrl: true,
    },
  },
} as const;

type Row = Awaited<
  ReturnType<typeof prisma.message.findMany<{ select: typeof SELECT }>>
>[number];

/** Group a message's reactions by emoji, noting which ones are mine. */
function summarise(reactions: { emoji: string; userId: string }[], me: string) {
  const byEmoji = new Map<
    string,
    { emoji: string; count: number; mine: boolean }
  >();

  for (const reaction of reactions) {
    const entry = byEmoji.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      count: 0,
      mine: false,
    };
    entry.count += 1;
    if (reaction.userId === me) entry.mine = true;
    byEmoji.set(reaction.emoji, entry);
  }

  return [...byEmoji.values()];
}

export function shapeMessages(
  rows: Row[],
  me: string,
  names: { you: string; other: string },
): ChatMessage[] {
  return rows.map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    mine: message.senderId === me,
    read: message.readAt !== null,
    deleted: message.deletedAt !== null,
    replyTo:
      message.replyTo && !message.replyTo.deletedAt
        ? {
            id: message.replyTo.id,
            author: message.replyTo.senderId === me ? names.you : names.other,
            body: message.replyTo.body,
            hasMedia: message.replyTo.mediaUrl !== null,
          }
        : null,
    reactions: summarise(message.reactions, me),
    media:
      message.mediaUrl && message.mediaKind
        ? {
            url: message.mediaUrl,
            kind: message.mediaKind,
            name: message.mediaName,
          }
        : null,
  }));
}

/** Load and shape in one go, for the endpoint. */
export async function loadMessages(
  matchId: string,
  me: string,
  names: { you: string; other: string },
): Promise<ChatMessage[]> {
  const rows = await prisma.message.findMany({
    where: { matchId },
    // Newest first with a take, then reversed: ascending would return the
    // *oldest* 200, so a long conversation showed its beginning for ever.
    orderBy: { createdAt: "desc" },
    take: MESSAGE_WINDOW,
    select: SELECT,
  });

  return shapeMessages(rows.slice().reverse(), me, names);
}
