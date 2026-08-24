import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/sign-out-button";

export default async function BannedPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bannedAt: true, banReason: true },
  });

  if (!user?.bannedAt) redirect("/feed");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Your account is suspended
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
        {user.banReason
          ? `Reason given: ${user.banReason}`
          : "This account has been suspended for breaking our community rules."}
      </p>
      <p className="mt-3 max-w-md text-sm text-neutral-500">
        If you think this is a mistake, reply to the email we sent you and a
        moderator will look at it again.
      </p>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </main>
  );
}
