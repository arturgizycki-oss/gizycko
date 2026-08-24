"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkContent } from "@/lib/content-policy";
import { isAdult, MIN_AGE } from "@/lib/age";
import { Gender } from "@/generated/prisma/enums";

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

  const allowed = checkContent(`${parsed.data.displayName} ${parsed.data.bio ?? ""}`);
  if (!allowed.ok) return { error: allowed.message };

  const { birthDate } = parsed.data;
  if (!isAdult(birthDate)) {
    return { error: `You must be at least ${MIN_AGE} to use this site.` };
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

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  redirect("/discover");
}
