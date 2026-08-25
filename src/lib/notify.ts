import { prisma } from "./prisma";
import { pushToUser } from "./realtime";
import type { NotificationType } from "@/generated/prisma/enums";

export type Notice = {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  entityId?: string | null;
};

/**
 * Record a notification and tell the member it happened.
 *
 * One function rather than a push written out beside each of the nine places
 * that create one. Those two steps belong together: a notification nobody is
 * told about is the bug this exists to prevent, and a helper is the only way to
 * make the next one that gets added correct without anybody remembering to.
 *
 * The push cannot fail the write - see push() - so this is as reliable as the
 * insert alone.
 */
export async function notify(notice: Notice): Promise<void> {
  await prisma.notification.create({ data: notice });
  await pushToUser(notice.userId, "notification");
}

/** The same for several people at once, as a match notifies both sides. */
export async function notifyAll(notices: Notice[]): Promise<void> {
  if (notices.length === 0) return;

  await prisma.notification.createMany({ data: notices });
  await Promise.all(
    [...new Set(notices.map((n) => n.userId))].map((userId) =>
      pushToUser(userId, "notification"),
    ),
  );
}
