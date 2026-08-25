import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { visibleGroup } from "@/lib/groups";
import { can, ROLE_LABEL } from "@/lib/group-roles";
import { friendIds, hiddenUserIds } from "@/lib/social";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { Avatar } from "@/components/avatar";
import { CollapsibleSection } from "@/components/collapsible-section";
import { shortWhen } from "@/lib/time";
import { GroupComposer } from "./group-composer";
import { InviteFriend } from "./invite-friend";
import { JoinLeave } from "./join-leave";
import { MemberControls } from "./member-controls";
import { GroupSettings } from "./group-settings";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { session } = await requireProfile();
  const me = session.user.id;

  const found = await visibleGroup(groupId, me);
  if (!found) notFound();

  const { group, role } = found;
  const isMember = role !== null;

  const [posts, members, hidden, friends] = await Promise.all([
    isMember
      ? prisma.post.findMany({
          where: { groupId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            author: {
              select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
            },
          },
        })
      : Promise.resolve([]),
    prisma.groupMember.findMany({
      where: { groupId },
      orderBy: { joinedAt: "asc" },
      include: {
        user: { select: { id: true, name: true, profile: { select: PROFILE_AVATAR } } },
      },
    }),
    hiddenUserIds(me),
    can(role, "invite") ? friendIds(me) : Promise.resolve([]),
  ]);

  // Friends who are not in the group yet, for the invite list.
  const invitable = can(role, "invite")
    ? await prisma.user.findMany({
        where: {
          id: { in: friends.filter((id) => !hidden.includes(id)) },
          groupMembers: { none: { groupId } },
        },
        select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        take: 30,
      })
    : [];

  const pendingInvites = can(role, "invite")
    ? await prisma.groupInvite.count({ where: { groupId, status: "PENDING" } })
    : 0;

  return (
    <div className="space-y-4">
      <Link href="/groups" className="muted text-sm hover:underline">
        ← Groups
      </Link>

      <section className="card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{group.name}</h1>
            <p className="hint">
              {group._count.members} members · {group._count.posts} posts ·{" "}
              {group.visibility === "PRIVATE" ? "private" : "public"}
            </p>
          </div>
          <JoinLeave
            groupId={groupId}
            role={role}
            canJoin={group.visibility === "PUBLIC"}
          />
        </div>

        {group.description && (
          <p className="mt-3 text-sm whitespace-pre-wrap text-[var(--ink-muted)]">
            {group.description}
          </p>
        )}
      </section>

      {can(role, "editGroup") && (
        <GroupSettings
          groupId={groupId}
          name={group.name}
          description={group.description}
          visibility={group.visibility}
          canDelete={can(role, "deleteGroup")}
        />
      )}

      {can(role, "invite") && (
        <CollapsibleSection
          title="Invite friends"
          count={invitable.length}
          hint={pendingInvites > 0 ? `${pendingInvites} pending` : undefined}
        >
          {invitable.length === 0 ? (
            <p className="muted px-2 py-3 text-sm">
              All your friends are already here, or invited.
            </p>
          ) : (
            <ul className="space-y-2">
              {invitable.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2"
                >
                  <Avatar
                    name={person.profile?.displayName ?? person.name}
                    src={photoUrlOf(person.profile)}
                    size={36}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {person.profile?.displayName ?? person.name}
                  </span>
                  <InviteFriend groupId={groupId} userId={person.id} />
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Members" count={members.length}>
        <ul className="space-y-1">
          {members.map((member) => {
            const name = member.user.profile?.displayName ?? member.user.name;
            return (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2"
              >
                <Link href={member.user.id === me ? "/profile" : `/u/${member.user.id}`}>
                  <Avatar
                    name={name}
                    src={photoUrlOf(member.user.profile)}
                    size={36}
                  />
                </Link>

                <Link
                  href={member.user.id === me ? "/profile" : `/u/${member.user.id}`}
                  className="min-w-0 flex-1"
                >
                  <span className="block truncate text-sm font-medium">
                    {name}
                    {member.user.id === me && (
                      <span className="hint"> · you</span>
                    )}
                  </span>
                  <span className="hint">{ROLE_LABEL[member.role]}</span>
                </Link>

                <MemberControls
                  groupId={groupId}
                  userId={member.user.id}
                  actorRole={role}
                  targetRole={member.role}
                  isSelf={member.user.id === me}
                />
              </li>
            );
          })}
        </ul>

        <p className="hint mt-2 px-2">
          Owners appoint admins and hand the group over. Admins invite people,
          remove members, edit the group, and delete any post. Members read and
          write posts.
        </p>
      </CollapsibleSection>

      {isMember ? (
        <>
          <GroupComposer groupId={groupId} />

          {posts.length === 0 ? (
            <p className="empty-state">
              Nothing posted here yet. Start the conversation.
            </p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => {
                const name = post.author.profile?.displayName ?? post.author.name;
                return (
                  <li key={post.id} className="card p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={name}
                        src={photoUrlOf(post.author.profile)}
                        size={32}
                      />
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="hint">{shortWhen(post.createdAt)}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm whitespace-pre-wrap">{post.body}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <p className="empty-state">
          Join this group to read and write its posts.
        </p>
      )}
    </div>
  );
}
