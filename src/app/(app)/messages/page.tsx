import { requireProfile } from "@/lib/session";
import { listConversations } from "@/lib/messages";
import { hiddenUserIds } from "@/lib/social";
import { shortWhen } from "@/lib/time";
import { Inbox, type InboxItem } from "./inbox";

export const metadata = { title: "Messages — gizycko" };

export default async function MessagesPage() {
  const { session } = await requireProfile();
  const me = session.user.id;

  const [conversations, hidden] = await Promise.all([
    listConversations(me),
    hiddenUserIds(me),
  ]);

  const items: InboxItem[] = conversations
    .filter((conversation) => !hidden.includes(conversation.otherUserId))
    .map((conversation) => ({
      matchId: conversation.matchId,
      otherUserId: conversation.otherUserId,
      name: conversation.name,
      photo: conversation.photo,
      preview: conversation.lastBody
        ? `${conversation.lastFromMe ? "You: " : ""}${conversation.lastBody}`
        : "You matched. Say hello.",
      when: shortWhen(conversation.lastAt),
      unread: conversation.unread,
      closed: conversation.closed,
    }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-neutral-500">
          Every conversation you have. Tap a photo to open the profile, the name
          to open the chat.
        </p>
      </div>

      <Inbox items={items} />
    </div>
  );
}
