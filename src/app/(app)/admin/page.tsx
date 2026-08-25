import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { shortWhen } from "@/lib/time";

/** Anything newer than this counts as "this week" in the figures below. */
function weekAgo() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

export default async function AdminOverviewPage() {
  const since = weekAgo();

  const [
    members,
    newMembers,
    completed,
    banned,
    posts,
    newPosts,
    messages,
    matches,
    groups,
    openReports,
    pendingPhotos,
    recent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.profile.count({ where: { completedAt: { not: null } } }),
    prisma.user.count({ where: { bannedAt: { not: null } } }),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.post.count({
      where: { deletedAt: null, createdAt: { gte: since } },
    }),
    prisma.message.count({ where: { deletedAt: null } }),
    prisma.match.count({ where: { unmatchedAt: null, origin: "SWIPE" } }),
    prisma.group.count(),
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.photo.count({ where: { moderation: "PENDING" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bannedAt: true,
        emailVerified: true,
        createdAt: true,
        profile: { select: { displayName: true, completedAt: true } },
      },
    }),
  ]);

  const needsAttention = openReports > 0 || pendingPhotos > 0;

  return (
    <div className="space-y-6">
      {needsAttention && (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{
            background: "var(--gh-attention-bg)",
            borderColor:
              "color-mix(in srgb, var(--gh-attention) 40%, transparent)",
            color: "var(--gh-attention)",
          }}
        >
          <strong>Waiting for you.</strong>{" "}
          {openReports > 0 && (
            <>
              <Link href="/admin/reports" className="underline">
                {openReports} open {openReports === 1 ? "report" : "reports"}
              </Link>
              {pendingPhotos > 0 && " and "}
            </>
          )}
          {pendingPhotos > 0 && (
            <Link href="/admin/photos" className="underline">
              {pendingPhotos} {pendingPhotos === 1 ? "photo" : "photos"} to
              review
            </Link>
          )}
          .
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Members"
          value={members}
          note={`+${newMembers} this week`}
        />
        <Stat
          label="Finished profiles"
          value={completed}
          note={`${members - completed} not finished`}
        />
        <Stat label="Posts" value={posts} note={`+${newPosts} this week`} />
        <Stat label="Messages" value={messages} />
        <Stat label="Matches" value={matches} note="dating, still live" />
        <Stat label="Groups" value={groups} />
        <Stat label="Open reports" value={openReports} />
        <Stat label="Banned" value={banned} />
      </section>

      <section className="gh-box">
        <div className="gh-box-header flex items-center justify-between gap-3">
          <span>Newest members</span>
          <Link href="/admin/members" className="gh-link text-xs font-normal">
            All members
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="gh-row gh-muted">Nobody has signed up yet.</p>
        ) : (
          recent.map((user) => (
            <div
              key={user.id}
              className="gh-row flex flex-wrap items-center gap-2"
            >
              <Link
                href={`/admin/members?q=${encodeURIComponent(user.email)}`}
                className="gh-link font-semibold"
              >
                {user.profile?.displayName ?? user.name}
              </Link>

              <span className="gh-muted min-w-0 flex-1 truncate">
                {user.email}
              </span>

              {user.role !== "USER" && (
                <span className="gh-label gh-label-accent">
                  {user.role.toLowerCase()}
                </span>
              )}
              {user.bannedAt && (
                <span className="gh-label gh-label-danger">banned</span>
              )}
              {!user.emailVerified && (
                <span className="gh-label">unconfirmed</span>
              )}
              {!user.profile?.completedAt && (
                <span className="gh-label">no profile</span>
              )}

              <span className="gh-muted shrink-0">
                {shortWhen(user.createdAt)}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="gh-box p-4">
      <p className="gh-muted">{label}</p>
      <p className="gh-stat mt-1 tabular-nums">{value.toLocaleString()}</p>
      {note && <p className="gh-muted mt-0.5">{note}</p>}
    </div>
  );
}
