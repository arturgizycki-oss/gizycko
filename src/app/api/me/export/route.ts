import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** GDPR art. 20 - everything this account holds, as machine-readable JSON. */
export async function GET() {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;

  const [
    user,
    profile,
    swipes,
    matches,
    messages,
    posts,
    comments,
    reactions,
    friendships,
    blocks,
    reports,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        role: true,
      },
    }),
    prisma.profile.findUnique({
      where: { userId },
      include: { photos: true },
    }),
    prisma.swipe.findMany({ where: { fromUserId: userId } }),
    prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    }),
    prisma.message.findMany({ where: { senderId: userId } }),
    prisma.post.findMany({
      where: { authorId: userId },
      include: { images: true },
    }),
    prisma.comment.findMany({ where: { authorId: userId } }),
    prisma.reaction.findMany({ where: { userId } }),
    prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    }),
    prisma.block.findMany({ where: { blockerId: userId } }),
    prisma.report.findMany({ where: { reporterId: userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    profile,
    swipes,
    matches,
    messages,
    posts,
    comments,
    reactions,
    friendships,
    blocks,
    reports,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="gizycko-data-${userId}.json"`,
    },
  });
}
