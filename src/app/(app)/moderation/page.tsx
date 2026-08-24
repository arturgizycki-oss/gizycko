import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/session";
import { BanControls } from "./ban-controls";
import { removePost, resolveReport, reviewPhoto } from "./actions";

const REASON_LABEL: Record<string, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  NUDITY: "Nudity",
  FAKE_PROFILE: "Fake profile",
  UNDERAGE: "Underage",
  HATE_SPEECH: "Hate speech",
  SCAM: "Scam",
  OTHER: "Other",
};

export default async function ModerationPage() {
  await requireModerator();

  const [reports, pendingPhotos, bannedUsers] = await Promise.all([
    prisma.report.findMany({
      where: { status: { in: ["OPEN", "REVIEWING"] } },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        reporter: { select: { id: true, name: true } },
        reportedUser: { select: { id: true, name: true, bannedAt: true } },
        post: { select: { id: true, body: true, authorId: true } },
        comment: { select: { id: true, body: true, authorId: true } },
        message: { select: { id: true, body: true, senderId: true } },
      },
    }),
    prisma.photo.findMany({
      where: { moderation: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 24,
      include: {
        profile: { select: { displayName: true, userId: true } },
      },
    }),
    prisma.user.findMany({
      where: { bannedAt: { not: null } },
      select: { id: true, name: true, email: true, banReason: true, bannedAt: true },
      orderBy: { bannedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Moderation</h1>
        <p className="text-sm text-neutral-500">
          {reports.length} open reports · {pendingPhotos.length} photos to review
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-medium">Reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-neutral-500">Queue is empty.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => {
              const content =
                report.post?.body ?? report.comment?.body ?? report.message?.body;

              return (
                <li
                  key={report.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {REASON_LABEL[report.reason] ?? report.reason}
                      </p>
                      <p className="text-xs text-neutral-500">
                        reported by {report.reporter.name} ·{" "}
                        {report.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <form action={resolveReport.bind(null, report.id, "DISMISS")}>
                        <button
                          type="submit"
                          className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700"
                        >
                          Dismiss
                        </button>
                      </form>
                      <form action={resolveReport.bind(null, report.id, "ACTION")}>
                        <button
                          type="submit"
                          className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
                        >
                          Mark actioned
                        </button>
                      </form>
                    </div>
                  </div>

                  {report.details && (
                    <p className="mt-2 rounded-lg bg-neutral-50 p-2 text-sm dark:bg-neutral-800">
                      {report.details}
                    </p>
                  )}

                  {content && (
                    <blockquote className="mt-2 border-l-2 border-neutral-300 pl-3 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                      {content.slice(0, 400)}
                    </blockquote>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    {report.reportedUser && (
                      <>
                        <Link
                          href={`/u/${report.reportedUser.id}`}
                          className="underline"
                        >
                          View {report.reportedUser.name}
                        </Link>
                        <BanControls
                          userId={report.reportedUser.id}
                          banned={report.reportedUser.bannedAt !== null}
                        />
                      </>
                    )}
                    {report.post && (
                      <form action={removePost.bind(null, report.post.id)}>
                        <button type="submit" className="text-rose-600 hover:underline">
                          Remove post
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">Photos awaiting review</h2>
        {pendingPhotos.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing to review.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {pendingPhotos.map((photo) => (
              <li key={photo.id} className="space-y-1">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  <Image src={photo.url} alt="" fill sizes="200px" className="object-cover" />
                </div>
                <Link
                  href={`/u/${photo.profile.userId}`}
                  className="block truncate text-xs underline"
                >
                  {photo.profile.displayName}
                </Link>
                <div className="flex gap-2 text-xs">
                  <form action={reviewPhoto.bind(null, photo.id, true)}>
                    <button type="submit" className="text-emerald-600 hover:underline">
                      Approve
                    </button>
                  </form>
                  <form action={reviewPhoto.bind(null, photo.id, false)}>
                    <button type="submit" className="text-rose-600 hover:underline">
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">Banned accounts</h2>
        {bannedUsers.length === 0 ? (
          <p className="text-sm text-neutral-500">None.</p>
        ) : (
          <ul className="space-y-2">
            {bannedUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-neutral-500">
                    {user.email} · {user.banReason ?? "no reason recorded"}
                  </p>
                </div>
                <BanControls userId={user.id} banned />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
