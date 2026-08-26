import { reviewCounts } from "@/lib/review";
import { requireModerator } from "@/lib/session";
import { AdminNav } from "./nav";

export const metadata = { title: "Admin" };

/**
 * The admin area.
 *
 * Deliberately unlike the rest of the site: bordered, dense, no photographs.
 * Somebody reading reports should never be unsure which side of the site they
 * are on.
 *
 * Access is checked here rather than page by page, so a new page under /admin
 * cannot be added without it. The same check runs again in every action that
 * changes something, because a hidden button is not a permission.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireModerator();

  // Counts sit beside the section names, so nothing needing attention is a
  // click away from being noticed.
  const { reports, photos } = await reviewCounts();

  return (
    <div className="gh -mx-3 -mt-6 min-h-dvh px-4 pt-6 pb-24 sm:-mx-4 sm:-mt-8 sm:px-6 sm:pb-8">
      <header className="mb-6 border-b border-[var(--gh-border)] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">Admin</h1>
          <span className="gh-label gh-label-accent">
            {session.user.role.toLowerCase()}
          </span>
        </div>
        <p className="gh-muted mt-1">
          Signed in as {session.user.email}. Every action here is recorded
          against your account.
        </p>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="md:w-52 md:shrink-0">
          <AdminNav counts={{ Reports: reports, Photos: photos }} />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
