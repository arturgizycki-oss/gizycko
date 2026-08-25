import { requireProfile } from "@/lib/session";
import { listConversations } from "@/lib/messages";
import { hiddenUserIds } from "@/lib/social";
import { shortWhen } from "@/lib/time";
import { Inbox, type InboxItem } from "./inbox";
import { getTranslator } from "@/lib/i18n";

export const metadata = { title: "Messages - gizycko" };

export default async function MessagesPage() {
  const { session } = await requireProfile();
  const me = session.user.id;
  const t = await getTranslator();

  const [conversations, hidden] = await Promise.all([
    listConversations(me),
    hiddenUserIds(me),
  ]);

  const hiddenSet = new Set(hidden);

  const items: InboxItem[] = conversations
    .filter((conversation) => !hiddenSet.has(conversation.otherUserId))
    .map((conversation) => ({
      matchId: conversation.matchId,
      otherUserId: conversation.otherUserId,
      name: conversation.name,
      photo: conversation.photo,
      preview: conversation.lastBody
        ? `${conversation.lastFromMe ? `${t("messages.you")} ` : ""}${conversation.lastBody}`
        : t("matches.sayHello"),
      when: shortWhen(conversation.lastAt),
      unread: conversation.unread,
      closed: conversation.closed,
    }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("messages.title")}
        </h1>
        <p className="text-sm text-neutral-500">{t("messages.intro")}</p>
      </div>

      <Inbox items={items} />
    </div>
  );
}
