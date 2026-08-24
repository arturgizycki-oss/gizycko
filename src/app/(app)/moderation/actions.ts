"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/session";

export async function resolveReport(reportId: string, action: "DISMISS" | "ACTION") {
  const moderator = await requireModerator();

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: action === "DISMISS" ? "DISMISSED" : "ACTIONED",
      resolvedAt: new Date(),
      resolvedById: moderator.user.id,
    },
  });

  revalidatePath("/moderation");
}

export async function banUser(userId: string, reason: string) {
  const moderator = await requireModerator();
  if (userId === moderator.user.id) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { bannedAt: new Date(), banReason: reason },
    }),
    // A banned account disappears from Discover immediately.
    prisma.profile.updateMany({
      where: { userId },
      data: { isVisible: false },
    }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  revalidatePath("/moderation");
}

export async function unbanUser(userId: string) {
  await requireModerator();

  await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: null, banReason: null },
  });

  revalidatePath("/moderation");
}

export async function reviewPhoto(photoId: string, approve: boolean) {
  await requireModerator();

  await prisma.photo.update({
    where: { id: photoId },
    data: { moderation: approve ? "APPROVED" : "REJECTED" },
  });

  revalidatePath("/moderation");
}

export async function removePost(postId: string) {
  await requireModerator();

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/moderation");
  revalidatePath("/feed");
}
