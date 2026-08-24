import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { DangerZone } from "../profile/danger-zone";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { session, profile } = await requireProfile();

  const [blockedCount, user] = await Promise.all([
    prisma.block.count({ where: { blockerId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <section className="card p-4">
        <h2 className="text-sm font-medium">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="muted">Email</dt>
            <dd className="truncate">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted">Email confirmed</dt>
            <dd>{user?.emailVerified ? "Yes" : "Not yet"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted">Member since</dt>
            <dd>
              {user?.createdAt.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card divide-y divide-[var(--line)]">
        <h2 className="px-4 pt-4 pb-2 text-sm font-medium">Profile and privacy</h2>

        <SettingsLink
          href="/profile"
          title="Edit your profile"
          detail="Photos, bio, and who you want to meet"
        />
        <SettingsLink
          href="/settings/blocked"
          title="Blocked people"
          detail={
            blockedCount === 0
              ? "Nobody blocked"
              : `${blockedCount} blocked`
          }
        />
        <SettingsLink
          href="/profile"
          title="Visibility in Discover"
          detail={
            profile.isVisible
              ? "Your profile is shown to others"
              : "Your profile is hidden"
          }
        />
      </section>

      <section className="card divide-y divide-[var(--line)]">
        <h2 className="px-4 pt-4 pb-2 text-sm font-medium">Reading</h2>
        <SettingsLink href="/terms" title="Terms of service" detail="What you agree to" />
        <SettingsLink href="/privacy" title="Privacy policy" detail="What we hold, and why" />
        <SettingsLink href="/safety" title="Staying safe" detail="Advice before you meet someone" />
      </section>

      <DangerZone />
    </div>
  );
}

function SettingsLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-muted)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="hint">{detail}</span>
      </span>
      <span aria-hidden className="muted">
        ›
      </span>
    </Link>
  );
}
