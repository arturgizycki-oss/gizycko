import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { hiddenUserIds } from "@/lib/social";
import { Avatar } from "@/components/avatar";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { FriendButton } from "@/components/friend-button";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

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
      take: 8,
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
    <div className="space-y-8">
      <h1 className="text-xl font-semibold tracking-tight">Friends</h1>

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium">
            Requests ({incoming.length})
          </h2>
          <ul className="space-y-2">
            {incoming.map((request) => (
              <li
                key={request.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Link href={`/u/${request.requester.id}`}>
                  <Avatar
                    name={request.requester.profile?.displayName ?? request.requester.name}
                    src={photoUrlOf(request.requester.profile)}
                    size={40}
                  />
                </Link>
                <Link
                  href={`/u/${request.requester.id}`}
                  className="flex-1 text-sm font-medium hover:underline"
                >
                  {request.requester.profile?.displayName ?? request.requester.name}
                </Link>
                <FriendButton
                  userId={request.requester.id}
                  state="incoming"
                  friendshipId={request.id}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium">Your friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No friends yet. Send a request to someone below.
          </p>
        ) : (
          <ul className="space-y-2">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Link href={`/u/${friend.id}`}>
                  <Avatar
                    name={friend.profile?.displayName ?? friend.name}
                    src={photoUrlOf(friend.profile)}
                    size={40}
                  />
                </Link>
                <Link
                  href={`/u/${friend.id}`}
                  className="flex-1 text-sm font-medium hover:underline"
                >
                  {friend.profile?.displayName ?? friend.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {suggestions.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium">People you could add</h2>
          <ul className="space-y-2">
            {suggestions.map((person) => (
              <li
                key={person.userId}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Link href={`/u/${person.userId}`}>
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
        </section>
      )}
    </div>
  );
}
