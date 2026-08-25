import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";
import { getTranslator } from "@/lib/i18n";

export default async function OnboardingPage() {
  const session = await requireSession();
  const t = await getTranslator();

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { completedAt: true },
  });
  if (profile?.completedAt) redirect("/discover");

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("onboarding.title")}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">{t("onboarding.intro")}</p>
      <OnboardingForm defaultName={session.user.name} />
    </main>
  );
}
