import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getTranslator } from "@/lib/i18n";
import { loadMessages } from "@/lib/chat-messages";
import { PRIMARY_PHOTO_WHERE } from "@/lib/avatar";

/**
 * The conversation, for a chat that is already open.
 *
 * The chat used to get new messages by re-fetching its own page. There is a
 * loading.tsx above this route, so every one of those swapped the board for a
 * skeleton and put it back - the blink somebody sees after pressing send.
 *
 * Returning the messages as data instead means the list is replaced without
 * anything unmounting. Sending a message adds a message, which is all it
 * should ever have looked like.
 *
 * The whole window rather than what is new: an edit, a deletion, a reaction
 * and a read receipt all change a message that already exists, and asking for
 * "everything after the last id" would miss every one of them.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "signed out" }, { status: 401 });

  const { matchId } = await params;
  const me = session.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      userAId: true,
      userBId: true,
      userA: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              displayName: true,
              photos: { where: PRIMARY_PHOTO_WHERE, take: 1 },
            },
          },
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              displayName: true,
              photos: { where: PRIMARY_PHOTO_WHERE, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!match || (match.userAId !== me && match.userBId !== me)) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const other = match.userAId === me ? match.userB : match.userA;
  const t = await getTranslator();

  const messages = await loadMessages(matchId, me, {
    you: t("chat.you"),
    other: other.profile?.displayName ?? other.name,
  });

  return Response.json(
    { messages },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
