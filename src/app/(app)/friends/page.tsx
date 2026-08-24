import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { hiddenUserIds } from "@/lib/social";
import { Avatar } from "@/components/avatar";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { CollapsibleSection } from "@/components/collapsible-section";
import { FriendButton } from "@/components/friend-button";
import { openConversation } from "@/lib/actions/conversations";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

const rowClass =
  "flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800";

const emptyClass = "px-2 py-3 text-sm text-neutral-500";

export default async function FriendsPage() {
  const { session } = await requireProfile();
  const me = session.user.id;

  const hidden = await hiddenUserIds(me);

  const [incoming, accepted, suggestions] = await Promise.all([
    prisma.friendship.findMany({
      where: { addresseeId: me, status: "PENDING", requesterId: { notIn: hidden } },
      include: {
        requester: {
          select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: me }, { addresseeId: me }],
      },
      include: {
        requester: {
          select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        },
        addressee: {
          select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        },
      },
    }),
    prisma.profile.findMany({
      where: {
        completedAt: { not: null },
        isVisible: true,
        userId: { notIn: [me, ...hidden] },
        user: {
          bannedAt: null,
          friendRequestsSent: { none: { addresseeId: me } },
          friendRequestsReceived: { none: { requesterId: me } },
        },
      },
      orderBy: { lastActiveAt: "desc" },
      take: 20,
      select: {
        userId: true,
        displayName: true,
        city: true,
        photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
      },
    }),
  ]);

  const friends = accepted.map((row) =>
    row.requesterId === me ? row.addressee : row.requester,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Friends</h1>

      <CollapsibleSection
        title="Requests"
        count={incoming.length}
        hint="waiting for your answer"
        defaultOpen={incoming.length > 0}
      >
        {incoming.length === 0 ? (
          <p className={emptyClass}>No requests right now.</p>
        ) : (
          <ul>
            {incoming.map((request) => {
              const name =
                request.requester.profile?.displayName ?? request.requester.name;

              return (
                <li key={request.id} className={rowClass}>
                  <Link href={`/u/${request.requester.id}`} aria-label={name}>
                    <Avatar
                      name={name}
                      src={photoUrlOf(request.requester.profile)}
                      size={40}
                    />
                  </Link>
                  <Link
                    href={`/u/${request.requester.id}`}
                    className="flex-1 text-sm font-medium hover:underline"
                  >
                    {name}
                  </Link>
                  <FriendButton
                    userId={request.requester.id}
                    state="incoming"
                    friendshipId={request.id}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Your friends"
        count={friends.length}
        defaultOpen={friends.length > 0}
      >
        {friends.length === 0 ? (
          <p className={emptyClass}>
            No friends yet. Add someone from the suggestions below.
          </p>
        ) : (
          <ul>
            {friends.map((friend) => {
              const name = friend.profile?.displayName ?? friend.name;

              return (
                <li key={friend.id} className={rowClass}>
                  <Link href={`/u/${friend.id}`} aria-label={name}>
                    <Avatar
                      name={name}
                      src={photoUrlOf(friend.profile)}
                      size={40}
                    />
                  </Link>
                  <Link
                    href={`/u/${friend.id}`}
                    className="flex-1 text-sm font-medium hover:underline"
                  >
                    {name}
                  </Link>
                  <form action={openConversation.bind(null, friend.id)}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Message
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="People you could add"
        count={suggestions.length}
        hint="not connected yet"
      >
        {suggestions.length === 0 ? (
          <p className={emptyClass}>
            Nobody new to suggest. Try Discover to meet more people.
          </p>
        ) : (
          <ul>
            {suggestions.map((person) => (
              <li key={person.userId} className={rowClass}>
                <Link href={`/u/${person.userId}`} aria-label={person.displayName}>
                  <Avatar
                    name={person.displayName}
                    src={photoUrlOf(person)}
                    size={40}
                  />
                </Link>
                <div className="flex-1">
                  <Link
                    href={`/u/${person.userId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {person.displayName}
                  </Link>
                  {person.city && (
                    <p className="text-xs text-neutral-500">{person.city}</p>
                  )}
                </div>
                <FriendButton
                  userId={person.userId}
                  state="none"
                  friendshipId={null}
                />
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </div>
  );
}
