"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/session";
import { deleteMemberFiles } from "@/lib/member-files";

export type AdminResult = { error?: string };

/** Only an admin may change what somebody else is allowed to do. */
async function requireAdmin() {
  const session = await requireModerator();
  if (session.user.role !== "ADMIN") return null;
  return session;
}

const ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
type Role = (typeof ROLES)[number];

/**
 * Change a member's role.
 *
 * Moderators cannot do this - otherwise a moderator could promote themselves
 * to admin, and the distinction between the two would mean nothing. Nobody can
 * change their own role either, which is what stops the last admin quietly
 * demoting themselves and locking everyone out.
 */
export async function setRole(
  userId: string,
  role: string,
): Promise<AdminResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Only an admin can change roles." };

  if (!ROLES.includes(role as Role)) return { error: "Unknown role." };
  if (userId === session.user.id) {
    return { error: "You cannot change your own role." };
  }

  // Demoting the last admin would leave nobody able to promote anyone.
  if (role !== "ADMIN") {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (target?.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) return { error: "That is the only admin left." };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as Role },
  });

  revalidatePath("/admin/members");
  return {};
}

/** Bar somebody from signing in, and end the session they already have. */
export async function banMember(
  userId: string,
  reason: string,
): Promise<AdminResult> {
  const session = await requireModerator();

  if (userId === session.user.id) {
    return { error: "You cannot ban yourself." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // A moderator cannot ban another moderator or an admin.
  if (target && target.role !== "USER" && session.user.role !== "ADMIN") {
    return { error: "Only an admin can ban staff." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        bannedAt: new Date(),
        banReason: reason.trim().slice(0, 200) || "No reason given",
      },
    }),
    // A ban with a live session is not a ban.
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  revalidatePath("/admin/members");
  return {};
}

export async function unbanMember(userId: string): Promise<AdminResult> {
  await requireModerator();

  await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: null, banReason: null },
  });

  revalidatePath("/admin/members");
  return {};
}

/** Take a profile out of Discover without banning the person. */
export async function setVisibility(
  userId: string,
  visible: boolean,
): Promise<AdminResult> {
  await requireModerator();

  await prisma.profile.updateMany({
    where: { userId },
    data: { isVisible: visible },
  });

  revalidatePath("/admin/members");
  return {};
}

/**
 * Delete a member and everything they uploaded.
 *
 * Admin only, and irreversible: the row cascades to their profile, photos,
 * posts, comments, messages, matches and group memberships, and their files
 * are removed from the bucket first. A ban is the reversible tool; this is for
 * an erasure request, or an account that should never have existed.
 *
 * Files go first. If the row went first there would be nothing left naming
 * them, and they would sit in storage forever.
 */
export async function deleteMember(userId: string): Promise<AdminResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Only an admin can delete an account." };

  if (userId === session.user.id) {
    return { error: "You cannot delete your own account here." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!target) return { error: "That account is already gone." };

  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { error: "That is the only admin left." };
  }

  await deleteMemberFiles(userId);
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/members");
  return {};
}
