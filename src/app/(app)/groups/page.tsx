import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { hiddenUserIds } from "@/lib/social";
import { CollapsibleSection } from "@/components/collapsible-section";
import { InviteResponse } from "./invite-response";
import { getTranslator } from "@/lib/i18n";
import { SearchField } from "@/components/search-field";
import { readQuery, searchGroups } from "@/lib/search";
import { ROLE_LABEL } from "@/lib/group-roles";

export const metadata = { title: "Groups" };

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { session } = await requireProfile();
  const me = session.user.id;
  const t = await getTranslator();

  const query = readQuery((await searchParams).q);

  const hidden = await hiddenUserIds(me);

  const [memberships, invites, discoverable] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId: me },
      orderBy: { joinedAt: "desc" },
      include: {
        group: {
          include: { _count: { select: { members: true, posts: true } } },
        },
      },
    }),
    prisma.groupInvite.findMany({
      where: {
        invitedUserId: me,
        status: "PENDING",
        invitedById: { notIn: hidden },
      },
      orderBy: { createdAt: "desc" },
      include: {
        group: { select: { id: true, name: true, description: true } },
        invitedBy: {
          select: { name: true, profile: { select: { displayName: true } } },
        },
      },
    }),
    prisma.group.findMany({
      where: { visibility: "PUBLIC", members: { none: { userId: me } } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { _count: { select: { members: true } } },
    }),
  ]);

  if (query) {
    const found = await searchGroups(me, query);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {t("groups.title")}
            </h1>
            <p className="muted text-sm">{t("groups.intro")}</p>
          </div>
          <Link href="/groups/new" className="btn btn-primary btn-sm shrink-0">
            {t("groups.new")}
          </Link>
        </div>

        <SearchField placeholder={t("search.groups")} initial={query} />

        <section className="card p-2">
          <p className="label px-2 pt-1 pb-2">
            {t("search.results")} ({found.length})
          </p>

          {found.length === 0 ? (
            <p className="muted px-2 py-3 text-sm">{t("search.noGroups")}</p>
          ) : (
            <ul className="space-y-1">
              {found.map((group) => (
                <li key={group.id}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="block rounded-xl px-2 py-2 hover:bg-[var(--surface-muted)]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium">{group.name}</span>
                      {group.joined && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                          {t("groups.member")}
                        </span>
                      )}
                    </span>
                    <span className="hint">
                      {group.members} {t("groups.membersMany")}
                      {group.description
                        ? ` · ${group.description.slice(0, 60)}`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("groups.title")}
          </h1>
          <p className="muted text-sm">{t("groups.intro")}</p>
        </div>
        <Link href="/groups/new" className="btn btn-primary btn-sm shrink-0">
          {t("groups.new")}
        </Link>
      </div>

      <SearchField placeholder={t("search.groups")} />

      <CollapsibleSection
        title={t("groups.invites")}
        count={invites.length}
        hint={t("friends.requestsHint")}
        defaultOpen={invites.length > 0}
      >
        {invites.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">{t("groups.invitesEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{invite.group.name}</p>
                  <p className="hint">
                    {t("groups.invitedBy")}{" "}
                    {invite.invitedBy.profile?.displayName ??
                      invite.invitedBy.name}
                  </p>
                </div>
                <InviteResponse inviteId={invite.id} />
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={t("groups.yours")}
        count={memberships.length}
        defaultOpen={memberships.length > 0}
      >
        {memberships.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">
            {t("groups.yoursEmptyLong")}
          </p>
        ) : (
          <ul className="space-y-2">
            {memberships.map(({ group, role }) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="block rounded-xl px-2 py-2 hover:bg-[var(--surface-muted)]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium">{group.name}</span>
                    {role !== "MEMBER" && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                        {t(ROLE_LABEL[role])}
                      </span>
                    )}
                    {group.visibility === "PRIVATE" && (
                      <span className="hint">{t("groups.private")}</span>
                    )}
                  </span>
                  <span className="hint">
                    {group._count.members} {t("groups.membersMany")} ·{" "}
                    {group._count.posts} {t("groups.postsCount")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={t("groups.publicToJoin")}
        count={discoverable.length}
      >
        {discoverable.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">{t("groups.publicEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {discoverable.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="block rounded-xl px-2 py-2 hover:bg-[var(--surface-muted)]"
                >
                  <span className="block text-sm font-medium">
                    {group.name}
                  </span>
                  <span className="hint">
                    {group._count.members} {t("groups.membersMany")}
                    {group.description
                      ? ` · ${group.description.slice(0, 60)}`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </div>
  );
}
