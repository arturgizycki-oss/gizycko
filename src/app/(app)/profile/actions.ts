"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkContent } from "@/lib/content-policy";
import { checkUploadedImage, MAX_PROFILE_PHOTOS } from "@/lib/image";
import {
  deleteObject,
  keyFromMediaUrl,
  mediaUrl,
  putObject,
} from "@/lib/storage";

export type ActionState = {
  error?: string;
  ok?: boolean;
  submissionId?: string;
};

async function myProfile(userId: string) {
  return prisma.profile.findUniqueOrThrow({
    where: { userId },
    select: { id: true },
  });
}

export async function uploadPhoto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const profile = await myProfile(session.user.id);

  const file = formData.get("photo");
  if (!(file instanceof File)) return { error: "Choose an image first." };

  const existing = await prisma.photo.findMany({
    where: { profileId: profile.id },
    select: { position: true },
    orderBy: { position: "desc" },
  });

  if (existing.length >= MAX_PROFILE_PHOTOS) {
    return { error: `You can have at most ${MAX_PROFILE_PHOTOS} photos.` };
  }

  // Deleting a photo from the middle leaves a gap, so counting rows would
  // reuse a position that is already taken. Take the next one after the last.
  const nextPosition = existing.length === 0 ? 0 : existing[0].position + 1;

  const checked = await checkUploadedImage(file);
  if (!checked.ok) return { error: checked.error };

  const key = `photos/${session.user.id}/${randomUUID()}${checked.kind.extension}`;
  await putObject(key, checked.bytes);

  await prisma.photo.create({
    data: {
      profileId: profile.id,
      url: mediaUrl(key),
      position: nextPosition,
      isPrimary: existing.length === 0,
      // Reactive moderation: photos are visible right away and hidden only once
      // a moderator rejects them. PENDING is the queue, not a block.
      moderation: "PENDING",
    },
  });

  revalidatePath("/profile");
  // A fresh id tells the form this upload landed, so it can clear itself.
  return { ok: true, submissionId: randomUUID() };
}

export async function deletePhoto(photoId: string) {
  const session = await requireSession();

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { profile: { select: { userId: true } } },
  });
  if (!photo || photo.profile.userId !== session.user.id) return;

  const key = keyFromMediaUrl(photo.url);
  if (key) await deleteObject(key);

  await prisma.photo.delete({ where: { id: photoId } });

  // Promote another photo if the primary one just went away.
  if (photo.isPrimary) {
    const next = await prisma.photo.findFirst({
      where: { profileId: photo.profileId },
      orderBy: { position: "asc" },
    });
    if (next) {
      await prisma.photo.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  revalidatePath("/profile");
}

export async function setPrimaryPhoto(photoId: string) {
  const session = await requireSession();

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { profile: { select: { userId: true } } },
  });
  if (!photo || photo.profile.userId !== session.user.id) return;

  await prisma.$transaction([
    prisma.photo.updateMany({
      where: { profileId: photo.profileId },
      data: { isPrimary: false },
    }),
    prisma.photo.update({ where: { id: photoId }, data: { isPrimary: true } }),
  ]);

  revalidatePath("/profile");
}

const GENDERS = ["MAN", "WOMAN", "NONBINARY", "OTHER"] as const;

const editSchema = z
  .object({
    displayName: z.string().trim().min(2).max(40),
    bio: z.string().trim().max(2000).optional(),
    occupation: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    interestedIn: z.array(z.enum(GENDERS)).min(1),
    minAgePref: z.coerce.number().int().min(18).max(99),
    maxAgePref: z.coerce.number().int().min(18).max(99),
    maxDistanceKm: z.coerce.number().int().min(1).max(500),
    isVisible: z.boolean(),
  })
  .refine((value) => value.minAgePref <= value.maxAgePref, {
    message: "The minimum age cannot be above the maximum.",
  });

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = editSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || undefined,
    occupation: formData.get("occupation") || undefined,
    city: formData.get("city") || undefined,
    interestedIn: formData.getAll("interestedIn"),
    minAgePref: formData.get("minAgePref"),
    maxAgePref: formData.get("maxAgePref"),
    maxDistanceKm: formData.get("maxDistanceKm"),
    isVisible: formData.get("isVisible") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const allowed = checkContent(
    `${parsed.data.displayName} ${parsed.data.bio ?? ""} ${parsed.data.occupation ?? ""}`,
  );
  if (!allowed.ok) return { error: allowed.message };

  await prisma.profile.update({
    where: { userId: session.user.id },
    data: parsed.data,
  });

  revalidatePath("/profile");
  return { ok: true };
}
