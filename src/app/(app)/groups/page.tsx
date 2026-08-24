import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { hiddenUserIds } from "@/lib/social";
import { CollapsibleSection } from "@/components/collapsible-section";
import { InviteResponse } from "./invite-response";

export const metadata = { title: "Groups" };

export default async function GroupsPage() {
  const { session } = await requireProfile();
  const me = session.user.id;

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
      where: { invitedUserId: me, status: "PENDING", invitedById: { notIn: hidden } },
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Groups</h1>
          <p className="muted text-sm">
            A space to share with several people at once.
          </p>
        </div>
        <Link href="/groups/new" className="btn btn-primary btn-sm shrink-0">
          New group
        </Link>
      </div>

      <CollapsibleSection
        title="Invitations"
        count={invites.length}
        hint="waiting for your answer"
        defaultOpen={invites.length > 0}
      >
        {invites.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">No invitations right now.</p>
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
                    invited by{" "}
                    {invite.invitedBy.profile?.displayName ?? invite.invitedBy.name}
                  </p>
                </div>
                <InviteResponse inviteId={invite.id} />
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Your groups"
        count={memberships.length}
        defaultOpen={memberships.length > 0}
      >
        {memberships.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">
            You are not in any group yet. Create one, or join a public group
            below.
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
                        {role.toLowerCase()}
                      </span>
                    )}
                    {group.visibility === "PRIVATE" && (
                      <span className="hint">private</span>
                    )}
                  </span>
                  <span className="hint">
                    {group._count.members} members · {group._count.posts} posts
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Public groups to join" count={discoverable.length}>
        {discoverable.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">
            Nothing public to join right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {discoverable.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="block rounded-xl px-2 py-2 hover:bg-[var(--surface-muted)]"
                >
                  <span className="block text-sm font-medium">{group.name}</span>
                  <span className="hint">
                    {group._count.members} members
                    {group.description ? ` · ${group.description.slice(0, 60)}` : ""}
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
