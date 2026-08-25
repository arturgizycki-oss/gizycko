"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkContent } from "@/lib/content-policy";
import { isAdult, MIN_AGE } from "@/lib/age";
import { Gender } from "@/generated/prisma/enums";
import { checkUploadedImage } from "@/lib/image";
import { mediaUrl, putObject } from "@/lib/storage";
import { verifyUploaded } from "@/lib/uploads";
import { randomUUID } from "node:crypto";

const GENDERS = ["MAN", "WOMAN", "NONBINARY", "OTHER"] as const;

const onboardingSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  birthDate: z.coerce.date(),
  gender: z.enum(GENDERS),
  interestedIn: z.array(z.enum(GENDERS)).min(1),
  city: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(2000).optional(),
});

export type OnboardingState = { error?: string };

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await requireSession();

  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    interestedIn: formData.getAll("interestedIn"),
    city: formData.get("city") || undefined,
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please fill in every required field." };
  }

  const allowed = checkContent(
    `${parsed.data.displayName} ${parsed.data.bio ?? ""}`,
  );
  if (!allowed.ok) return { error: allowed.message };

  const { birthDate } = parsed.data;
  if (!isAdult(birthDate)) {
    return { error: `You must be at least ${MIN_AGE} to use this site.` };
  }

  /*
   * A photograph is required to finish signing up.
   *
   * A profile with no face is the one nobody likes and nobody answers, so the
   * member concludes the site is empty and leaves - and it is also the shape
   * every fake account takes. Asking once, here, is kinder than letting
   * somebody wait a week for nothing.
   */
  const photoKey = formData.get("photoKey");
  const photoFile = formData.get("photo");

  let storedKey: string | null = null;

  if (typeof photoKey === "string" && photoKey.length > 0) {
    const verified = await verifyUploaded(photoKey, "image", session.user.id);
    if (!verified.ok) return { error: verified.error };
    storedKey = photoKey;
  } else if (photoFile instanceof File && photoFile.size > 0) {
    const checked = await checkUploadedImage(photoFile);
    if (!checked.ok) return { error: checked.error };

    storedKey = `photos/${session.user.id}/${randomUUID()}${checked.kind.extension}`;
    await putObject(storedKey, checked.bytes);
  }

  // Somebody who already added one is not asked again.
  const existingPhotos = await prisma.photo.count({
    where: { profile: { userId: session.user.id } },
  });

  if (!storedKey && existingPhotos === 0) {
    return { error: "Add a photo of yourself to finish." };
  }

  const data = {
    displayName: parsed.data.displayName,
    birthDate,
    gender: parsed.data.gender as Gender,
    interestedIn: parsed.data.interestedIn as Gender[],
    city: parsed.data.city,
    bio: parsed.data.bio,
    completedAt: new Date(),
  };

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
    select: { id: true },
  });

  if (storedKey) {
    await prisma.photo.create({
      data: {
        profileId: profile.id,
        url: mediaUrl(storedKey),
        position: existingPhotos,
        isPrimary: existingPhotos === 0,
        // Visible at once; the queue is a second look, not a gate.
        moderation: "PENDING",
      },
    });
  }

  redirect("/discover");
}
