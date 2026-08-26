import { prisma } from "./prisma";

/**
 * How much is waiting for a moderator: open reports, and photos not yet judged.
 *
 * The other admin sections are lists rather than queues - music and video are
 * browsed, not worked through - so counting them would put a number on the menu
 * that never went down.
 */
export async function pendingReviewCount(): Promise<number> {
  const [reports, photos] = await prisma.$transaction([
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.photo.count({ where: { moderation: "PENDING" } }),
  ]);

  return reports + photos;
}

/** The same two numbers, for the sidebar that shows them separately. */
export async function reviewCounts(): Promise<{
  reports: number;
  photos: number;
}> {
  const [reports, photos] = await prisma.$transaction([
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.photo.count({ where: { moderation: "PENDING" } }),
  ]);

  return { reports, photos };
}

/** Whether a role may see any of this. */
export function isStaff(role: string): boolean {
  return role === "MODERATOR" || role === "ADMIN";
}
