"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const postSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  visibility: z.enum(["PUBLIC", "FRIENDS", "MATCHES", "PRIVATE"]),
});

export type PostState = { error?: string };

export async function createPost(
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  const session = await requireSession();

  const parsed = postSchema.safeParse({
    body: formData.get("body"),
    visibility: formData.get("visibility") ?? "FRIENDS",
  });

  if (!parsed.success) {
    return { error: "Write something first (max 5000 characters)." };
  }

  await prisma.post.create({
    data: {
      authorId: session.user.id,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
    },
  });

  revalidatePath("/feed");
  return {};
}

export async function toggleReaction(postId: string) {
  const session = await requireSession();

  const existing = await prisma.reaction.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { userId: session.user.id, postId, type: "LIKE" },
    });
  }

  revalidatePath("/feed");
}

const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function addComment(
  postId: string,
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  const session = await requireSession();

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: "Write something first." };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, deletedAt: true },
  });
  if (!post || post.deletedAt) return { error: "That post is gone." };

  const comment = await prisma.comment.create({
    data: { postId, authorId: session.user.id, body: parsed.data.body },
  });

  if (post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "POST_COMMENT",
        actorId: session.user.id,
        entityId: comment.id,
      },
    });
  }

  revalidatePath(`/feed/${postId}`);
  return {};
}

/** Soft delete, so replies and reports keep their anchor. */
export async function deleteComment(commentId: string) {
  const session = await requireSession();

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });
  if (!comment || comment.authorId !== session.user.id) return;

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date(), body: "" },
  });

  revalidatePath(`/feed/${comment.postId}`);
}

export async function deletePost(postId: string) {
  const session = await requireSession();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post || post.authorId !== session.user.id) return;

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/feed");
}
