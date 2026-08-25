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
import { BannedList } from "./banned-list";
import { InvitePeople } from "./invite-people";
import { deleteGroupPost } from "../actions";
import { getTranslator } from "@/lib/i18n";
import { CopyLink } from "@/components/copy-link";
import { ChevronLeftIcon } from "@/components/icons";
import { ConfirmButton } from "@/components/confirm-button";

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
  const t = await getTranslator();

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
              select: {
                id: true,
                name: true,
                profile: { select: PROFILE_AVATAR },
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.groupMember.findMany({
      where: { groupId },
      orderBy: { joinedAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        },
      },
    }),
    hiddenUserIds(me),
    can(role, "invite") ? friendIds(me) : Promise.resolve([]),
  ]);

  const hiddenSet = new Set(hidden);

  // Friends who are not in the group yet, for the invite list.
  const invitable = can(role, "invite")
    ? await prisma.user.findMany({
        where: {
          id: { in: friends.filter((id) => !hiddenSet.has(id)) },
          groupMembers: { none: { groupId } },
        },
        select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        take: 30,
      })
    : [];

  const pendingInvites = can(role, "invite")
    ? await prisma.groupInvite.count({ where: { groupId, status: "PENDING" } })
    : 0;

  const banned = can(role, "banMember")
    ? await prisma.groupBan.findMany({
        where: { groupId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: PROFILE_AVATAR },
            },
          },
        },
      })
    : [];

  return (
    <div className="space-y-4">
      <Link href="/groups" className="muted text-sm hover:underline">
        <ChevronLeftIcon className="size-4" />
        {t("groups.title")}
      </Link>

      <section className="card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              {group.name}
            </h1>
            <p className="hint">
              {group._count.members} {t("groups.membersMany")} ·{" "}
              {group._count.posts} {t("groups.postsCount")} ·{" "}
              {group.visibility === "PRIVATE"
                ? t("groups.private")
                : t("groups.public")}
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

      {group.rules && (
        <section className="card p-4">
          <h2 className="text-sm font-medium">{t("groups.rules")}</h2>
          <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--ink-muted)]">
            {group.rules}
          </p>
        </section>
      )}

      {can(role, "editGroup") && (
        <GroupSettings
          groupId={groupId}
          name={group.name}
          description={group.description}
          rules={group.rules}
          visibility={group.visibility}
          canDelete={can(role, "deleteGroup")}
        />
      )}

      {can(role, "invite") && (
        <CollapsibleSection
          title={t("groups.inviteFriendsTitle")}
          count={invitable.length}
          hint={
            pendingInvites > 0
              ? `${pendingInvites} ${t("groups.pending")}`
              : undefined
          }
        >
          <InvitePeople groupId={groupId} />

          <p className="label mt-3 px-2">{t("groups.inviteFriends")}</p>

          {invitable.length === 0 ? (
            <p className="muted px-2 py-3 text-sm">{t("groups.allInvited")}</p>
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

      <CollapsibleSection title={t("groups.members")} count={members.length}>
        <ul className="space-y-1">
          {members.map((member) => {
            const name = member.user.profile?.displayName ?? member.user.name;
            return (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2"
              >
                <Link
                  href={
                    member.user.id === me ? "/profile" : `/u/${member.user.id}`
                  }
                >
                  <Avatar
                    name={name}
                    src={photoUrlOf(member.user.profile)}
                    size={36}
                  />
                </Link>

                <Link
                  href={
                    member.user.id === me ? "/profile" : `/u/${member.user.id}`
                  }
                  className="min-w-0 flex-1"
                >
                  <span className="block truncate text-sm font-medium">
                    {name}
                    {member.user.id === me && (
                      <span className="hint"> · {t("groups.you")}</span>
                    )}
                  </span>
                  <span className="hint">{t(ROLE_LABEL[member.role])}</span>
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

        <p className="hint mt-2 px-2">{t("groups.roleHint")}</p>
      </CollapsibleSection>

      {can(role, "banMember") && (
        <CollapsibleSection title={t("groups.banned")} count={banned.length}>
          <BannedList
            groupId={groupId}
            people={banned.map((ban) => ({
              userId: ban.user.id,
              name: ban.user.profile?.displayName ?? ban.user.name,
              photo: photoUrlOf(ban.user.profile),
              reason: ban.reason,
            }))}
          />
        </CollapsibleSection>
      )}

      {isMember ? (
        <>
          <GroupComposer groupId={groupId} />

          {posts.length === 0 ? (
            <p className="empty-state">{t("groups.startConversation")}</p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => {
                const name =
                  post.author.profile?.displayName ?? post.author.name;
                return (
                  <li key={post.id} id={`post-${post.id}`} className="card p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={name}
                        src={photoUrlOf(post.author.profile)}
                        size={32}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{name}</p>
                        <p className="hint">{shortWhen(post.createdAt)}</p>
                      </div>

                      {/* Group posts live on the group page, so that anchor
                          is the link worth sharing. */}
                      <CopyLink path={`/groups/${groupId}#post-${post.id}`} />

                      {(post.authorId === me || can(role, "moderatePosts")) && (
                        <ConfirmButton
                          label={t("action.delete")}
                          question={t("confirm.deletePost")}
                          destructive
                          formAction={deleteGroupPost.bind(null, post.id)}
                        />
                      )}
                    </div>
                    <p className="mt-3 text-sm whitespace-pre-wrap">
                      {post.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <p className="empty-state">{t("groups.joinToRead")}</p>
      )}
    </div>
  );
}
