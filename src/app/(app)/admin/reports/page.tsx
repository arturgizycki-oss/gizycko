import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/session";
import { shortWhen } from "@/lib/time";
import { removePost, resolveReport } from "../../moderation/actions";
import { MemberControls } from "../members/member-controls";

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

export default async function AdminReportsPage() {
  const session = await requireModerator();

  const reports = await prisma.report.findMany({
    where: { status: { in: ["OPEN", "REVIEWING"] } },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: {
      reporter: { select: { id: true, name: true } },
      reportedUser: {
        select: {
          id: true,
          name: true,
          role: true,
          bannedAt: true,
          profile: { select: { isVisible: true } },
        },
      },
      post: { select: { id: true, body: true } },
      comment: { select: { id: true, body: true } },
      message: { select: { id: true, body: true } },
    },
  });

  return (
    <div className="space-y-4">
      <section className="gh-box">
        <div className="gh-box-header">
          {reports.length} open {reports.length === 1 ? "report" : "reports"}
        </div>

        {reports.length === 0 ? (
          <p className="gh-row gh-muted">
            Nothing waiting. Reports arrive here from the button on every
            profile, post, comment and message.
          </p>
        ) : (
          reports.map((report) => {
            const quoted =
              report.post?.body ?? report.comment?.body ?? report.message?.body;

            return (
              <div key={report.id} className="gh-row">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="gh-label gh-label-danger">
                    {REASON_LABEL[report.reason] ?? report.reason}
                  </span>
                  <span className="gh-muted min-w-0 flex-1">
                    reported by {report.reporter.name} &middot;{" "}
                    {shortWhen(report.createdAt)}
                  </span>

                  <form action={resolveReport.bind(null, report.id, "DISMISS")}>
                    <button type="submit" className="gh-btn">
                      Dismiss
                    </button>
                  </form>
                  <form action={resolveReport.bind(null, report.id, "ACTION")}>
                    <button type="submit" className="gh-btn">
                      Mark actioned
                    </button>
                  </form>
                </div>

                {report.details && (
                  <p
                    className="mt-2 rounded-md p-2 text-sm"
                    style={{ background: "var(--gh-subtle)" }}
                  >
                    {report.details}
                  </p>
                )}

                {quoted && (
                  <blockquote
                    className="mt-2 border-l-2 pl-3 text-sm"
                    style={{
                      borderColor: "var(--gh-border)",
                      color: "var(--gh-muted)",
                    }}
                  >
                    {quoted.slice(0, 400)}
                  </blockquote>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {report.reportedUser && (
                    <>
                      <Link
                        href={`/u/${report.reportedUser.id}`}
                        className="gh-link text-xs"
                      >
                        View {report.reportedUser.name}
                      </Link>
                      <MemberControls
                        member={{
                          id: report.reportedUser.id,
                          role: report.reportedUser.role,
                          banned: report.reportedUser.bannedAt !== null,
                          visible:
                            report.reportedUser.profile?.isVisible ?? false,
                        }}
                        viewerIsAdmin={session.user.role === "ADMIN"}
                        isSelf={report.reportedUser.id === session.user.id}
                      />
                    </>
                  )}

                  {report.post && (
                    <form action={removePost.bind(null, report.post.id)}>
                      <button type="submit" className="gh-btn gh-btn-danger">
                        Remove post
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
