import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { unreadMessageCount } from "@/lib/messages";
import { isStaff, pendingReviewCount } from "@/lib/review";

/**
 * What is waiting for the signed-in member, for the badges in the header.
 *
 * The layout counts these too, but a layout is only rebuilt when somebody
 * navigates. Sitting on the feed while a like arrives, nothing would change
 * until the next click - so the badge announced things several minutes after
 * they happened, which is worse than not having one.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return Response.json({ notifications: 0, messages: 0, review: 0 });
  }

  const [notifications, messages, review] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
    unreadMessageCount(session.user.id),
    // Never counted for an ordinary member: it would be a queue they cannot
    // see, and the number itself says how much is wrong on the site.
    isStaff(session.user.role) ? pendingReviewCount() : 0,
  ]);

  return Response.json(
    { notifications, messages, review },
    // Never let a proxy hold on to one member's counts.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
