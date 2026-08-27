import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { MarkRead } from "./mark-read";
import { getLocale, getTranslator } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { LocalTime } from "@/components/local-time";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

/** Notification type to the phrase that follows the actor's name. */
const TEXT: Record<string, MessageKey> = {
  MATCH: "notifications.match",
  MESSAGE: "notifications.message",
  PROFILE_LIKE: "notifications.profileLike",
  FRIEND_REQUEST: "notifications.friendRequest",
  FRIEND_ACCEPTED: "notifications.friendAccepted",
  POST_REACTION: "notifications.postReaction",
  POST_COMMENT: "notifications.postComment",
};

function hrefFor(
  type: string,
  entityId: string | null,
  actorId: string | null,
) {
  if (type === "MESSAGE" && entityId) return `/matches/${entityId}`;
  if (type === "MATCH") return "/matches";
  if (type === "FRIEND_REQUEST" || type === "FRIEND_ACCEPTED")
    return "/friends";
  if ((type === "POST_COMMENT" || type === "POST_REACTION") && entityId) {
    return `/feed/${entityId}`;
  }
  if (actorId) return `/u/${actorId}`;
  return "/feed";
}

export default async function NotificationsPage() {
  const { session } = await requireProfile();
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: {
        select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
      },
    },
  });

  const unread = notifications.filter((n) => n.readAt === null).length;

  return (
    <div>
      <MarkRead unread={unread} />
      <h1 className="mb-6 text-xl font-semibold tracking-tight">
        {t("notifications.title")}
      </h1>

      {notifications.length === 0 ? (
        <p className="empty-state">{t("notifications.empty")}</p>
      ) : (
        <ul className="card divide-y divide-[var(--line)] overflow-hidden">
          {notifications.map((notification) => {
            const actorName =
              notification.actor?.profile?.displayName ??
              notification.actor?.name ??
              t("notifications.someone");

            return (
              <li
                key={notification.id}
                className={
                  notification.readAt
                    ? "flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    : "flex items-center gap-3 bg-brand-50/60 px-4 py-3 hover:bg-brand-50 dark:bg-brand-900/20 dark:hover:bg-brand-900/30"
                }
              >
                {notification.actorId ? (
                  <Link
                    href={`/u/${notification.actorId}`}
                    aria-label={actorName}
                  >
                    <Avatar
                      name={actorName}
                      src={photoUrlOf(notification.actor?.profile)}
                      size={36}
                    />
                  </Link>
                ) : (
                  <Avatar name={actorName} size={36} />
                )}
                <Link
                  href={hrefFor(
                    notification.type,
                    notification.entityId,
                    notification.actorId,
                  )}
                  className="min-w-0 flex-1"
                >
                  <p className="text-sm">
                    <span className="font-medium">{actorName}</span>{" "}
                    {t(TEXT[notification.type] ?? "notifications.other")}
                  </p>
                  <LocalTime
                    value={notification.createdAt.toISOString()}
                    locale={locale}
                    className="text-xs text-neutral-500"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
