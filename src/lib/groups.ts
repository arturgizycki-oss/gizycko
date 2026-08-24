import { cache } from "react";
import { prisma } from "./prisma";

export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

/** This user's role in the group, or null when they are not a member. */
export const roleInGroup = cache(
  async (groupId: string, userId: string): Promise<GroupRole | null> => {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });

    return member?.role ?? null;
  },
);

/** Only owners and admins may invite people or change the group. */
export function canManage(role: GroupRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * A group the viewer may look at, or null.
 *
 * A private group is invisible to everyone but its members — not merely
 * unjoinable, so a stray link gives nothing away.
 */
export async function visibleGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { members: true, posts: true } },
    },
  });

  if (!group) return null;

  const role = await roleInGroup(groupId, userId);
  if (group.visibility === "PRIVATE" && !role) return null;

  return { group, role };
}
