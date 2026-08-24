"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

async function isBlockedBetween(a: string, b: string) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { id: true },
  });
  return block !== null;
}

export async function sendFriendRequest(addresseeId: string) {
  const session = await requireSession();
  const me = session.user.id;
  if (addresseeId === me) return;

  if (await isBlockedBetween(me, addresseeId)) return;

  // If they already asked us, accept instead of creating a mirrored request.
  const incoming = await prisma.friendship.findUnique({
    where: { requesterId_addresseeId: { requesterId: addresseeId, addresseeId: me } },
  });

  if (incoming) {
    if (incoming.status !== "ACCEPTED") {
      await prisma.friendship.update({
        where: { id: incoming.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      await prisma.notification.create({
        data: { userId: addresseeId, type: "FRIEND_ACCEPTED", actorId: me },
      });
    }
    revalidatePath(`/u/${addresseeId}`);
    revalidatePath("/friends");
    return;
  }

  await prisma.friendship.upsert({
    where: { requesterId_addresseeId: { requesterId: me, addresseeId } },
    create: { requesterId: me, addresseeId },
    update: { status: "PENDING", respondedAt: null },
  });

  await prisma.notification.create({
    data: { userId: addresseeId, type: "FRIEND_REQUEST", actorId: me },
  });

  revalidatePath(`/u/${addresseeId}`);
  revalidatePath("/friends");
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean,
) {
  const session = await requireSession();

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    select: { addresseeId: true, requesterId: true, status: true },
  });

  // Only the person who received the request may answer it.
  if (!friendship || friendship.addresseeId !== session.user.id) return;
  if (friendship.status !== "PENDING") return;

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: {
      status: accept ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });

  if (accept) {
    await prisma.notification.create({
      data: {
        userId: friendship.requesterId,
        type: "FRIEND_ACCEPTED",
        actorId: session.user.id,
      },
    });
  }

  revalidatePath("/friends");
  revalidatePath("/feed");
}

export async function removeFriend(otherUserId: string) {
  const session = await requireSession();
  const me = session.user.id;

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: me, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: me },
      ],
    },
  });

  revalidatePath("/friends");
  revalidatePath(`/u/${otherUserId}`);
  revalidatePath("/feed");
}
