import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { ageFrom } from "@/lib/age";
import { Avatar } from "@/components/avatar";
import { photoUrlOf } from "@/lib/avatar";
import { ReportDialog } from "@/components/report-dialog";
import { BlockButton } from "@/components/block-button";
import { Chat } from "./chat";
import { markRead, unmatch } from "./actions";
import { getTranslator } from "@/lib/i18n";
import { ChevronLeftIcon, HeartOffIcon } from "@/components/icons";
import { ConfirmButton } from "@/components/confirm-button";

/** Group a message's reactions by emoji, noting which ones are mine. */
function summariseReactions(
  reactions: { emoji: string; userId: string }[],
  me: string,
) {
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

  return [...byEmoji.values()].sort((a, b) => b.count - a.count);
}

/** Just enough of the other person for the chat header. */
const CHAT_PARTNER = {
  id: true,
  name: true,
  profile: {
    select: {
      displayName: true,
      birthDate: true,
      city: true,
      photos: {
        where: { isPrimary: true, moderation: { not: "REJECTED" as const } },
        select: { url: true },
        take: 1,
      },
    },
  },
};

/** How much history the chat panel loads. */
const MESSAGE_WINDOW = 200;

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const { session } = await requireProfile();
  const me = session.user.id;
  const t = await getTranslator();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      unmatchedAt: true,
      userA: { select: CHAT_PARTNER },
      userB: { select: CHAT_PARTNER },
      messages: {
        // Newest first, then reversed below. Ascending with a take returns the
        // *oldest* 200, so a long conversation showed its beginning and never
        // the message that just arrived.
        orderBy: { createdAt: "desc" },
        take: MESSAGE_WINDOW,
        select: {
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
        },
      },
    },
  });

  if (!match || (match.userAId !== me && match.userBId !== me)) notFound();

  const other = match.userAId === me ? match.userB : match.userA;
  const messages = match.messages.slice().reverse();

  // The chat polls this page, so an unconditional markRead meant a write every
  // few seconds for the whole time a conversation stayed open.
  const hasUnread = messages.some(
    (message) => message.senderId !== me && message.readAt === null,
  );
  if (hasUnread) await markRead(matchId);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/messages"
            className="text-sm text-neutral-500 hover:underline"
          >
            <ChevronLeftIcon className="size-4" />
            {t("nav.messages")}
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <Link href={`/u/${other.id}`}>
              <Avatar
                name={other.profile?.displayName ?? other.name}
                src={photoUrlOf(other.profile)}
                size={44}
              />
            </Link>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                {other.profile?.displayName ?? other.name}
                {other.profile && `, ${ageFrom(other.profile.birthDate)}`}
              </h1>
              {other.profile?.city && (
                <p className="text-sm text-neutral-500">{other.profile.city}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {!match.unmatchedAt && (
            <ConfirmButton
              label={t("matches.unmatch")}
              icon={<HeartOffIcon className="size-3.5" />}
              question={t("confirm.unmatch")}
              destructive
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-rose-600"
              formAction={unmatch.bind(null, matchId)}
            />
          )}
          <BlockButton userId={other.id} />
          <ReportDialog target={{ reportedUserId: other.id }} />
        </div>
      </header>

      <Chat
        matchId={matchId}
        closed={match.unmatchedAt !== null}
        otherName={other.profile?.displayName ?? other.name}
        messages={messages.map((message) => ({
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
                  author:
                    message.replyTo.senderId === me
                      ? t("chat.you")
                      : (other.profile?.displayName ?? other.name),
                  body: message.replyTo.body,
                  hasMedia: message.replyTo.mediaUrl !== null,
                }
              : null,
          reactions: summariseReactions(message.reactions, me),
          media:
            message.mediaUrl && message.mediaKind
              ? {
                  url: message.mediaUrl,
                  kind: message.mediaKind,
                  name: message.mediaName,
                }
              : null,
        }))}
      />
    </div>
  );
}
