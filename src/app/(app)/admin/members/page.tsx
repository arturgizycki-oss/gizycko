import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/session";
import { shortWhen } from "@/lib/time";
import type { Prisma } from "@/generated/prisma/client";
import { MemberControls } from "./member-controls";
import { MemberSearch } from "./search";

const PAGE_SIZE = 25;

type Search = { q?: string; filter?: string; page?: string };

/** The filters offered above the list, and what each one narrows to. */
const FILTERS: { key: string; label: string; where: Prisma.UserWhereInput }[] =
  [
    { key: "all", label: "All", where: {} },
    {
      key: "staff",
      label: "Staff",
      where: { role: { in: ["MODERATOR", "ADMIN"] } },
    },
    { key: "banned", label: "Banned", where: { bannedAt: { not: null } } },
    {
      key: "unconfirmed",
      label: "Unconfirmed",
      where: { emailVerified: false },
    },
    {
      key: "incomplete",
      label: "No profile",
      /*
       * Both halves of "no profile", which is why this is an OR.
       *
       * Somebody who signed up and stopped has no profile row at all, and
       * `profile: { is: ... }` never matches those - it can only test a row
       * that exists. The filter therefore found nobody while the overview
       * counted nine and every one of them wore a "no profile" badge.
       */
      where: {
        OR: [
          { profile: { is: null } },
          { profile: { is: { completedAt: null } } },
        ],
      },
    },
  ];

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await requireModerator();
  const { q, filter, page } = await searchParams;

  const query = q?.trim() ?? "";
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const current = Math.max(1, Number(page) || 1);

  // Search covers the three things staff actually have to hand: an email
  // address from a complaint, a display name from a report, or the account id
  // out of a URL.
  const search: Prisma.UserWhereInput = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { id: query },
          {
            profile: {
              is: { displayName: { contains: query, mode: "insensitive" } },
            },
          },
        ],
      }
    : {};

  const where: Prisma.UserWhereInput = { AND: [active.where, search] };

  const [total, members] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (current - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bannedAt: true,
        banReason: true,
        emailVerified: true,
        createdAt: true,
        profile: {
          select: { displayName: true, completedAt: true, isVisible: true },
        },
        _count: { select: { posts: true, reportsAgainst: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const viewerIsAdmin = session.user.role === "ADMIN";

  function href(next: Partial<Search>) {
    const params = new URLSearchParams();
    const merged = { q: query, filter: active.key, page: "1", ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.filter && merged.filter !== "all")
      params.set("filter", merged.filter);
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    const search = params.toString();
    return search ? `/admin/members?${search}` : "/admin/members";
  }

  return (
    <div className="space-y-4">
      <MemberSearch initial={query} filter={active.key} />

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={href({ filter: item.key })}
            className={
              item.key === active.key ? "gh-btn font-semibold" : "gh-btn"
            }
          >
            {item.label}
          </Link>
        ))}
      </div>

      <section className="gh-box">
        <div className="gh-box-header">
          {total.toLocaleString()} {total === 1 ? "member" : "members"}
          {query && <> matching &ldquo;{query}&rdquo;</>}
        </div>

        {members.length === 0 ? (
          <p className="gh-row gh-muted">Nobody matches that.</p>
        ) : (
          members.map((member) => (
            <div key={member.id} className="gh-row">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/u/${member.id}`}
                  className="gh-link font-semibold"
                >
                  {member.profile?.displayName ?? member.name}
                </Link>

                <span className="gh-muted min-w-0 flex-1 truncate">
                  {member.email}
                </span>

                {member.role !== "USER" && (
                  <span className="gh-label gh-label-accent">
                    {member.role.toLowerCase()}
                  </span>
                )}
                {member.bannedAt && (
                  <span className="gh-label gh-label-danger">banned</span>
                )}
                {!member.emailVerified && (
                  <span className="gh-label">unconfirmed</span>
                )}
                {member.profile && !member.profile.isVisible && (
                  <span className="gh-label">hidden</span>
                )}
                {member._count.reportsAgainst > 0 && (
                  <span className="gh-label gh-label-danger">
                    {member._count.reportsAgainst} reported
                  </span>
                )}
              </div>

              <p className="gh-muted mt-1">
                Joined {shortWhen(member.createdAt)} &middot;{" "}
                {member._count.posts}{" "}
                {member._count.posts === 1 ? "post" : "posts"}
                {member.banReason && <> &middot; banned: {member.banReason}</>}
              </p>

              <div className="mt-2">
                <MemberControls
                  member={{
                    id: member.id,
                    role: member.role,
                    banned: member.bannedAt !== null,
                    visible: member.profile?.isVisible ?? false,
                  }}
                  viewerIsAdmin={viewerIsAdmin}
                  isSelf={member.id === session.user.id}
                />
              </div>
            </div>
          ))
        )}
      </section>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="gh-muted">
            Page {current} of {pages}
          </span>
          <span className="flex gap-2">
            {current > 1 && (
              <Link
                href={href({ page: String(current - 1) })}
                className="gh-btn"
              >
                Previous
              </Link>
            )}
            {current < pages && (
              <Link
                href={href({ page: String(current + 1) })}
                className="gh-btn"
              >
                Next
              </Link>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
