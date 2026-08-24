"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkContent } from "@/lib/content-policy";
import { canManage, roleInGroup } from "@/lib/groups";

export type GroupState = { error?: string };

const groupSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(1000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export async function createGroup(
  _prev: GroupState,
  formData: FormData,
): Promise<GroupState> {
  const session = await requireSession();

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility") ?? "PUBLIC",
  });

  if (!parsed.success) {
    return { error: "Give the group a name of at least 3 characters." };
  }

  const allowed = checkContent(`${parsed.data.name} ${parsed.data.description ?? ""}`);
  if (!allowed.ok) return { error: allowed.message };

  // The creator is the owner and the first member, in one transaction so a
  // group can never exist with nobody in it.
  const group = await prisma.group.create({
    data: {
      ...parsed.data,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
    select: { id: true },
  });

  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function inviteToGroup(groupId: string, userId: string) {
  const session = await requireSession();

  const role = await roleInGroup(groupId, session.user.id);
  if (!canManage(role)) return;

  const already = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });
  if (already) return;

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: session.user.id, blockedId: userId },
        { blockerId: userId, blockedId: session.user.id },
      ],
    },
    select: { id: true },
  });
  if (blocked) return;

  await prisma.groupInvite.upsert({
    where: { groupId_invitedUserId: { groupId, invitedUserId: userId } },
    create: {
      groupId,
      invitedUserId: userId,
      invitedById: session.user.id,
      status: "PENDING",
    },
    update: { status: "PENDING", invitedById: session.user.id },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "GROUP_INVITE",
      actorId: session.user.id,
      entityId: groupId,
    },
  });

  revalidatePath(`/groups/${groupId}`);
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  const session = await requireSession();

  const invite = await prisma.groupInvite.findUnique({
    where: { id: inviteId },
    select: { groupId: true, invitedUserId: true, status: true },
  });

  // Only the person invited may answer, and only once.
  if (!invite || invite.invitedUserId !== session.user.id) return;
  if (invite.status !== "PENDING") return;

  await prisma.groupInvite.update({
    where: { id: inviteId },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });

  if (accept) {
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: invite.groupId, userId: session.user.id } },
      create: { groupId: invite.groupId, userId: session.user.id },
      update: {},
    });
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${invite.groupId}`);
}

export async function joinGroup(groupId: string) {
  const session = await requireSession();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { visibility: true },
  });

  // Private groups are invitation-only.
  if (!group || group.visibility !== "PUBLIC") return;

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId: session.user.id } },
    create: { groupId, userId: session.user.id },
    update: {},
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
}

export async function leaveGroup(groupId: string) {
  const session = await requireSession();

  const role = await roleInGroup(groupId, session.user.id);
  if (!role) return;

  // The owner cannot walk out and leave the group ownerless.
  if (role === "OWNER") return;

  await prisma.groupMember.deleteMany({
    where: { groupId, userId: session.user.id },
  });

  revalidatePath("/groups");
  redirect("/groups");
}

const postSchema = z.object({ body: z.string().trim().min(1).max(5000) });

export async function postToGroup(
  groupId: string,
  _prev: GroupState,
  formData: FormData,
): Promise<GroupState> {
  const session = await requireSession();

  const role = await roleInGroup(groupId, session.user.id);
  if (!role) return { error: "Join the group before posting." };

  const parsed = postSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: "Write something first." };

  const allowed = checkContent(parsed.data.body);
  if (!allowed.ok) return { error: allowed.message };

  await prisma.post.create({
    data: {
      authorId: session.user.id,
      groupId,
      body: parsed.data.body,
      // Group posts are scoped by groupId; this keeps them out of the main feed.
      visibility: "PRIVATE",
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return {};
}
