import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await requireSession();

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { completedAt: true },
  });
  if (profile?.completedAt) redirect("/discover");

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Tell us about you
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        This is what other people will see. You can change it any time.
      </p>
      <OnboardingForm defaultName={session.user.name} />
    </main>
  );
}
