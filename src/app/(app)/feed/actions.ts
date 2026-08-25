"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkContent } from "@/lib/content-policy";
import { readPostMedia } from "@/lib/post-media";
import { pushToFeed, pushToUser } from "@/lib/realtime";
import { notify } from "@/lib/notify";

const postSchema = z.object({
  body: z.string().trim().max(5000),
  visibility: z.enum(["PUBLIC", "FRIENDS", "MATCHES", "PRIVATE"]),
});

export type PostState = {
  error?: string;
  /* Changes only on success. The composer's fields are keyed on it, so a new
     one clears them; a failure carries the old one forward and keeps the text. */
  submissionId?: string;
  /* Changes on every attempt, successful or not, so that the same complaint
     twice running is still announced rather than deduplicated away. */
  attempt?: string;
};

export async function createPost(
  prev: PostState,
  formData: FormData,
): Promise<PostState> {
  const session = await requireSession();

  /*
   * A failure carries the previous id forward on purpose.
   *
   * The composer's fields are keyed on it, so changing it remounts them. That
   * is what clears a sent post, and it is also what would throw away a refused
   * one - leaving somebody who tripped the word filter to type it all again.
   */
  const failed = (error: string): PostState => ({
    error,
    submissionId: prev.submissionId,
    attempt: randomUUID(),
  });

  const parsed = postSchema.safeParse({
    body: formData.get("body"),
    visibility: formData.get("visibility") ?? "FRIENDS",
  });

  if (!parsed.success) {
    return failed("That post is too long (max 5000 characters).");
  }

  const uploaded = await readPostMedia(formData, session.user.id, "posts");
  if (!uploaded.ok) return failed(uploaded.error);

  if (parsed.data.body.length === 0 && !uploaded.hasAny) {
    return failed("Write something, or add a photo, a song, or a video.");
  }

  const allowed = checkContent(parsed.data.body);
  if (!allowed.ok) return failed(allowed.message);

  await prisma.post.create({
    data: {
      authorId: session.user.id,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
      audioUrl: uploaded.media.audioUrl,
      audioTitle: uploaded.media.audioTitle,
      audioType: uploaded.media.audioType,
      videoUrl: uploaded.media.videoUrl,
      videoType: uploaded.media.videoType,
      images: { create: uploaded.media.images },
    },
  });

  revalidatePath("/feed");
  await pushToFeed();

  /*
   * A fresh id on every success, which is what clears the composer.
   *
   * The fields are keyed on it, so a new one remounts them and takes the text,
   * the chosen files, and their previews with it. Returning an empty object
   * left the key unchanged, and a posted video stayed listed as though it were
   * still waiting to be sent.
   */
  return { submissionId: randomUUID(), attempt: randomUUID() };
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

  const allowed = checkContent(parsed.data.body);
  if (!allowed.ok) return { error: allowed.message };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, deletedAt: true },
  });
  if (!post || post.deletedAt) return { error: "That post is gone." };

  await prisma.comment.create({
    data: { postId, authorId: session.user.id, body: parsed.data.body },
  });

  if (post.authorId !== session.user.id) {
    await notify({
      userId: post.authorId,
      type: "POST_COMMENT",
      actorId: session.user.id,
      // The post, not the comment: that is what the notification opens.
      entityId: postId,
    });
  }

  revalidatePath(`/feed/${postId}`);

  if (post.authorId !== session.user.id) {
    await pushToUser(post.authorId, "notification");
  }

  return { submissionId: randomUUID() };
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
