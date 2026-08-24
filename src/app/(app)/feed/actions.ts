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
