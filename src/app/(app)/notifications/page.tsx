import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { MarkRead } from "./mark-read";

const TEXT: Record<string, string> = {
  MATCH: "matched with you",
  MESSAGE: "sent you a message",
  PROFILE_LIKE: "liked your profile",
  FRIEND_REQUEST: "sent you a friend request",
  FRIEND_ACCEPTED: "accepted your friend request",
  POST_REACTION: "reacted to your post",
  POST_COMMENT: "commented on your post",
};

function hrefFor(type: string, entityId: string | null, actorId: string | null) {
  if (type === "MESSAGE" && entityId) return `/matches/${entityId}`;
  if (type === "MATCH") return "/matches";
  if (type === "FRIEND_REQUEST" || type === "FRIEND_ACCEPTED") return "/friends";
  if (actorId) return `/u/${actorId}`;
  return "/feed";
}

export default async function NotificationsPage() {
  const { session } = await requireProfile();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: {
        select: { id: true, name: true, profile: { select: { displayName: true } } },
      },
    },
  });

  const unread = notifications.filter((n) => n.readAt === null).length;

  return (
    <div>
      <MarkRead unread={unread} />
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Nothing yet.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {notifications.map((notification) => {
            const actorName =
              notification.actor?.profile?.displayName ??
              notification.actor?.name ??
              "Someone";

            return (
              <li key={notification.id}>
                <Link
                  href={hrefFor(
                    notification.type,
                    notification.entityId,
                    notification.actorId,
                  )}
                  className={
                    notification.readAt
                      ? "flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      : "flex items-center gap-3 bg-rose-50/60 px-4 py-3 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30"
                  }
                >
                  <Avatar name={actorName} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{actorName}</span>{" "}
                      {TEXT[notification.type] ?? "did something"}
                    </p>
                    <time
                      dateTime={notification.createdAt.toISOString()}
                      className="text-xs text-neutral-500"
                    >
                      {notification.createdAt.toLocaleString()}
                    </time>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
