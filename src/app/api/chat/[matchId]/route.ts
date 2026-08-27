import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * The state of one conversation, small enough to ask for often.
 *
 * The chat used to learn about a new message by re-fetching the whole page on
 * a timer, which is far too heavy to do every couple of seconds - so it did it
 * every thirty, and a message sat unseen for half a minute.
 *
 * This is the cheap half of that: two columns and a boolean. The page is only
 * re-fetched when this says there is actually something new, so the common
 * case - nothing has happened - costs one small query.
 *
 * A push over the socket does the same job the instant it happens. This stays
 * as the floor underneath it, and as the whole mechanism until the socket is
 * configured.
 */
export const dynamic = "force-dynamic";

/** How long after the last keystroke somebody still counts as typing. */
const TYPING_WINDOW_MS = 6000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "signed out" }, { status: 401 });

  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      userAId: true,
      userBId: true,
      typingUserId: true,
      typingAt: true,
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, senderId: true, readAt: true },
      },
    },
  });

  const me = session.user.id;
  if (!match || (match.userAId !== me && match.userBId !== me)) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const latest = match.messages[0];

  const typing =
    match.typingUserId !== null &&
    match.typingUserId !== me &&
    match.typingAt !== null &&
    Date.now() - match.typingAt.getTime() < TYPING_WINDOW_MS;

  return Response.json(
    {
      // Enough to tell that something changed, without sending what changed:
      // the page fetch that follows applies the real permission checks.
      lastId: latest?.id ?? null,
      // Their ticks change when the other side reads, and nothing else moves,
      // so the sender needs this to know the mark is stale.
      lastRead:
        latest && latest.senderId === me ? latest.readAt !== null : null,
      typing,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
