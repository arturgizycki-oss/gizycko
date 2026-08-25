"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkContent } from "@/lib/content-policy";
import { roleInGroup } from "@/lib/groups";
import { can, canActOn, canLeave } from "@/lib/group-roles";
import { readPostMedia } from "@/lib/post-media";

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
  if (!can(role, "invite")) return;

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

  // The owner hands the group over or deletes it; they cannot simply walk out
  // and leave nobody able to administer it.
  if (!canLeave(role)) return;

  await prisma.groupMember.deleteMany({
    where: { groupId, userId: session.user.id },
  });

  revalidatePath("/groups");
  redirect("/groups");
}

const postSchema = z.object({ body: z.string().trim().max(5000) });

export async function postToGroup(
  groupId: string,
  _prev: GroupState,
  formData: FormData,
): Promise<GroupState> {
  const session = await requireSession();

  const role = await roleInGroup(groupId, session.user.id);
  if (!can(role, "post")) return { error: "Join the group before posting." };

  const parsed = postSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: "That post is too long." };

  const uploaded = await readPostMedia(formData, session.user.id, "groups");
  if (!uploaded.ok) return { error: uploaded.error };

  if (parsed.data.body.length === 0 && !uploaded.hasAny) {
    return { error: "Write something, or add a photo, a song, or a video." };
  }

  const allowed = checkContent(parsed.data.body);
  if (!allowed.ok) return { error: allowed.message };

  await prisma.post.create({
    data: {
      authorId: session.user.id,
      groupId,
      body: parsed.data.body,
      // Group posts are scoped by groupId; this keeps them out of the main feed.
      visibility: "PRIVATE",
      audioUrl: uploaded.media.audioUrl,
      audioTitle: uploaded.media.audioTitle,
      audioType: uploaded.media.audioType,
      videoUrl: uploaded.media.videoUrl,
      videoType: uploaded.media.videoType,
      images: { create: uploaded.media.images },
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return {};
}

/** Promote a member to admin, or demote an admin back to member. */
export async function setMemberRole(
  groupId: string,
  userId: string,
  role: "ADMIN" | "MEMBER",
) {
  const session = await requireSession();
  const actor = await roleInGroup(groupId, session.user.id);

  if (!can(actor, "manageAdmins")) return;
  if (userId === session.user.id) return;

  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
  if (!target || !canActOn(actor, target.role)) return;

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { role },
  });

  revalidatePath(`/groups/${groupId}`);
}

/** Remove somebody from the group. */
export async function removeMember(groupId: string, userId: string) {
  const session = await requireSession();
  const actor = await roleInGroup(groupId, session.user.id);

  if (!can(actor, "removeMember")) return;
  if (userId === session.user.id) return;

  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });

  // Rank decides: an admin may remove members but not another admin, and the
  // owner is untouchable.
  if (!target || !canActOn(actor, target.role)) return;

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
  await prisma.groupInvite.deleteMany({ where: { groupId, invitedUserId: userId } });

  revalidatePath(`/groups/${groupId}`);
}

/** Hand the group to another member, who becomes owner. */
export async function transferOwnership(groupId: string, userId: string) {
  const session = await requireSession();
  const actor = await roleInGroup(groupId, session.user.id);

  if (!can(actor, "transferOwnership")) return;
  if (userId === session.user.id) return;

  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });
  if (!target) return;

  // Both sides move together, or the group ends up with two owners or none.
  await prisma.$transaction([
    prisma.group.update({ where: { id: groupId }, data: { ownerId: userId } }),
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { role: "OWNER" },
    }),
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: session.user.id } },
      data: { role: "ADMIN" },
    }),
  ]);

  revalidatePath(`/groups/${groupId}`);
}

const editSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(1000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export async function updateGroup(
  groupId: string,
  _prev: GroupState,
  formData: FormData,
): Promise<GroupState> {
  const session = await requireSession();
  const actor = await roleInGroup(groupId, session.user.id);

  if (!can(actor, "editGroup")) return { error: "You cannot edit this group." };

  const parsed = editSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility") ?? "PUBLIC",
  });
  if (!parsed.success) {
    return { error: "Give the group a name of at least 3 characters." };
  }

  const allowed = checkContent(`${parsed.data.name} ${parsed.data.description ?? ""}`);
  if (!allowed.ok) return { error: allowed.message };

  await prisma.group.update({ where: { id: groupId }, data: parsed.data });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return {};
}

/** Delete a post in the group. Authors may delete their own; admins any. */
export async function deleteGroupPost(postId: string) {
  const session = await requireSession();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, groupId: true },
  });
  if (!post?.groupId) return;

  const actor = await roleInGroup(post.groupId, session.user.id);
  const mine = post.authorId === session.user.id;

  if (!mine && !can(actor, "moderatePosts")) return;

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/groups/${post.groupId}`);
}

/** Delete the group outright. Owner only. */
export async function deleteGroup(groupId: string) {
  const session = await requireSession();
  const actor = await roleInGroup(groupId, session.user.id);

  if (!can(actor, "deleteGroup")) return;

  await prisma.group.delete({ where: { id: groupId } });

  revalidatePath("/groups");
  redirect("/groups");
}
