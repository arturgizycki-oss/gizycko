import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Which of my conversations somebody is currently writing in.
 *
 * One query for the whole list, rather than the list asking per row: an inbox
 * of thirty conversations would otherwise be thirty requests every couple of
 * seconds, which is how a small convenience becomes the heaviest thing on the
 * site.
 *
 * Ids only. Who is typing to me is not a secret from me, but there is nothing
 * else the list needs and nothing else worth sending.
 */
export const dynamic = "force-dynamic";

/** How long after the last keystroke somebody still counts as typing. */
const TYPING_WINDOW_MS = 6000;

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ typing: [] }, { status: 401 });

  const me = session.user.id;

  const rows = await prisma.match.findMany({
    where: {
      unmatchedAt: null,
      OR: [{ userAId: me }, { userBId: me }],
      // Somebody else, recently. My own typing is not news to me.
      typingUserId: { not: me },
      typingAt: { gt: new Date(Date.now() - TYPING_WINDOW_MS) },
    },
    select: { id: true },
  });

  return Response.json(
    { typing: rows.map((row) => row.id) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
