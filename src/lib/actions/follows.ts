"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { requireSession } from "@/lib/session";

/**
 * Follow or unfollow someone. Following again removes it, so one button covers
 * both states.
 */
export async function toggleFollow(userId: string) {
  const session = await requireSession();
  const me = session.user.id;

  if (userId === me) return;

  // A block in either direction rules it out.
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: me, blockedId: userId },
        { blockerId: userId, blockedId: me },
      ],
    },
    select: { id: true },
  });
  if (blocked) return;

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: me, followingId: userId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: me, followingId: userId },
    });
    await notify({ userId, type: "NEW_FOLLOWER", actorId: me });
  }

  revalidatePath(`/u/${userId}`);
  revalidatePath("/profile");
}
