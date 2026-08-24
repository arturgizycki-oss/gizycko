"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkUploadedImage } from "@/lib/image";
import { checkUploadedAudio, titleFromFileName } from "@/lib/audio";
import { mediaUrl, putObject } from "@/lib/storage";
import { MAX_POST_IMAGES } from "@/lib/post-media";

const postSchema = z.object({
  body: z.string().trim().max(5000),
  visibility: z.enum(["PUBLIC", "FRIENDS", "MATCHES", "PRIVATE"]),
});

export type PostState = { error?: string; submissionId?: string };

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
    return { error: "That post is too long (max 5000 characters)." };
  }

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_POST_IMAGES);

  const songEntry = formData.get("song");
  const song = songEntry instanceof File && songEntry.size > 0 ? songEntry : null;

  if (parsed.data.body.length === 0 && images.length === 0 && !song) {
    return { error: "Write something, or add a photo or a song." };
  }

  // Validate everything before writing any bytes, so a bad song does not leave
  // orphaned images sitting in storage.
  const imageUploads: { key: string; bytes: Buffer }[] = [];
  for (const image of images) {
    const checked = await checkUploadedImage(image);
    if (!checked.ok) return { error: checked.error };
    imageUploads.push({
      key: `posts/${session.user.id}/${randomUUID()}${checked.kind.extension}`,
      bytes: checked.bytes,
    });
  }

  let songUpload: { key: string; bytes: Buffer; type: string; title: string } | null = null;
  if (song) {
    const checked = await checkUploadedAudio(song);
    if (!checked.ok) return { error: checked.error };
    songUpload = {
      key: `songs/${session.user.id}/${randomUUID()}${checked.kind.extension}`,
      bytes: checked.bytes,
      type: checked.kind.contentType,
      title: titleFromFileName(song.name) || "Untitled track",
    };
  }

  await Promise.all([
    ...imageUploads.map((upload) => putObject(upload.key, upload.bytes)),
    ...(songUpload ? [putObject(songUpload.key, songUpload.bytes)] : []),
  ]);

  await prisma.post.create({
    data: {
      authorId: session.user.id,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
      audioUrl: songUpload ? mediaUrl(songUpload.key) : null,
      audioTitle: songUpload?.title ?? null,
      audioType: songUpload?.type ?? null,
      images: {
        create: imageUploads.map((upload, index) => ({
          url: mediaUrl(upload.key),
          position: index,
        })),
      },
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
