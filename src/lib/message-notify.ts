import { prisma } from "./prisma";

/** Somebody reading a conversation is counted as present for this long. */
const READING_WINDOW_MS = 90_000;

/**
 * Whether a new message in this conversation is worth a notification.
 *
 * Two cases where it is not, and both were producing them.
 *
 * The reader has the conversation open. Announcing a message somebody is
 * watching arrive puts a badge on the bell for something already on their
 * screen, and they have to go and clear it. Presence is inferred from when they
 * last read something here, because that is what the chat records while it is
 * open - see markRead.
 *
 * There is already one waiting. Otherwise a run of five messages leaves five
 * identical lines saying the same person wrote, and the list stops being a
 * summary of what happened.
 */
export async function worthNotifying(
  matchId: string,
  senderId: string,
  recipientId: string,
): Promise<boolean> {
  const [reading, waiting] = await Promise.all([
    prisma.message.findFirst({
      where: {
        matchId,
        senderId,
        readAt: { gt: new Date(Date.now() - READING_WINDOW_MS) },
      },
      select: { id: true },
    }),
    prisma.notification.findFirst({
      where: {
        userId: recipientId,
        type: "MESSAGE",
        entityId: matchId,
        readAt: null,
      },
      select: { id: true },
    }),
  ]);

  return !reading && !waiting;
}
