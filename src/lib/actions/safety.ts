"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { REPORT_REASON_VALUES } from "@/lib/report-reasons";

export type SafetyState = { error?: string; ok?: boolean };

const reportSchema = z.object({
  reason: z.enum(REPORT_REASON_VALUES),
  details: z.string().trim().max(2000).optional(),
  reportedUserId: z.string().optional(),
  postId: z.string().optional(),
  commentId: z.string().optional(),
  messageId: z.string().optional(),
});

export async function submitReport(
  _prev: SafetyState,
  formData: FormData,
): Promise<SafetyState> {
  const session = await requireSession();

  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
    reportedUserId: formData.get("reportedUserId") || undefined,
    postId: formData.get("postId") || undefined,
    commentId: formData.get("commentId") || undefined,
    messageId: formData.get("messageId") || undefined,
  });

  if (!parsed.success) return { error: "Pick a reason." };

  const { reason, details, reportedUserId, postId, commentId, messageId } = parsed.data;
  if (!reportedUserId && !postId && !commentId && !messageId) {
    return { error: "Nothing to report." };
  }
  if (reportedUserId === session.user.id) {
    return { error: "You cannot report yourself." };
  }

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      reportedUserId,
      postId,
      commentId,
      messageId,
      reason,
      details,
    },
  });

  return { ok: true };
}

/**
 * Block someone: hides both people from each other everywhere and ends any
 * match between them.
 */
export async function blockUser(blockedId: string) {
  const session = await requireSession();
  const me = session.user.id;
  if (blockedId === me) return;

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: me, blockedId } },
    create: { blockerId: me, blockedId },
    update: {},
  });

  const [userAId, userBId] = me < blockedId ? [me, blockedId] : [blockedId, me];
  await prisma.match.updateMany({
    where: { userAId, userBId, unmatchedAt: null },
    data: { unmatchedAt: new Date(), unmatchedById: me },
  });

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: me, addresseeId: blockedId },
        { requesterId: blockedId, addresseeId: me },
      ],
    },
  });

  revalidatePath("/matches");
  revalidatePath("/feed");
  revalidatePath("/discover");
}

export async function unblockUser(blockedId: string) {
  const session = await requireSession();

  await prisma.block.deleteMany({
    where: { blockerId: session.user.id, blockedId },
  });

  revalidatePath("/settings/blocked");
}
