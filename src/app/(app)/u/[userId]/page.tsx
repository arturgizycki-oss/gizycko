import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import {
  friendIds,
  hiddenUserIds,
  matchedUserIds,
  mutualFriendIds,
} from "@/lib/social";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { ageFrom } from "@/lib/age";
import { shortWhen } from "@/lib/time";
import { ReportDialog } from "@/components/report-dialog";
import { BlockButton } from "@/components/block-button";
import { Avatar } from "@/components/avatar";
import { CoverPhoto, PhotoGrid } from "@/components/photo-lightbox";
import { FriendButton } from "@/components/friend-button";
import { CollapsibleSection } from "@/components/collapsible-section";
import { openConversation } from "@/lib/actions/conversations";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { session } = await requireProfile();
  const me = session.user.id;

  if (userId === me) redirect("/profile");

  const hidden = await hiddenUserIds(me);
  if (hidden.includes(userId)) notFound();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      bannedAt: true,
      profile: { include: { photos: { orderBy: { position: "asc" } } } },
    },
  });

  if (!user?.profile || user.bannedAt) notFound();

  const [friends, matches, mutuals, friendship, match] = await Promise.all([
    friendIds(me),
    matchedUserIds(me),
    mutualFriendIds(me, userId),
    prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: me, addresseeId: userId },
          { requesterId: userId, addresseeId: me },
        ],
      },
    }),
    prisma.match.findFirst({
      where: {
        unmatchedAt: null,
        OR: [
          { userAId: me, userBId: userId },
          { userAId: userId, userBId: me },
        ],
      },
      select: { id: true },
    }),
  ]);

  const isFriend = friends.includes(userId);
  const isMatched = matches.includes(userId);
  const photos = user.profile.photos.filter((p) => p.moderation !== "REJECTED");

  /** What this viewer is allowed to see of their posts. */
  const postVisibility = [
    { visibility: "PUBLIC" as const },
    ...(isFriend ? [{ visibility: "FRIENDS" as const }] : []),
    ...(isMatched ? [{ visibility: "MATCHES" as const }] : []),
  ];

  const [posts, postCount, theirFriendships] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId, deletedAt: null, OR: postVisibility },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        body: true,
        createdAt: true,
        videoUrl: true,
        audioUrl: true,
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
        _count: {
          select: {
            reactions: true,
            comments: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.post.count({
      where: { authorId: userId, deletedAt: null, OR: postVisibility },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, name: true, profile: { select: PROFILE_AVATAR } } },
        addressee: { select: { id: true, name: true, profile: { select: PROFILE_AVATAR } } },
      },
    }),
  ]);

  // Their friends, minus anyone this viewer has blocked or been blocked by.
  const theirFriends = theirFriendships
    .map((row) => (row.requesterId === userId ? row.addressee : row.requester))
    .filter((person) => person.id !== me && !hidden.includes(person.id));

  const mutualSet = new Set(mutuals);
  const orderedFriends = [
    ...theirFriends.filter((person) => mutualSet.has(person.id)),
    ...theirFriends.filter((person) => !mutualSet.has(person.id)),
  ];

  const photoUrls = photos.map((photo) => photo.url);

  return (
    <div className="space-y-4">
      {/* ---------- header ---------- */}
      <section className="card overflow-hidden">
        <CoverPhoto
          photos={photoUrls}
          name={`${user.profile.displayName}, ${ageFrom(user.profile.birthDate)}`}
          subtitle={[user.profile.city ?? "Somewhere", user.profile.occupation]
            .filter(Boolean)
            .join(" · ")}
        />

        <div className="flex flex-wrap items-center gap-2 p-4">
          {match ? (
            <Link href={`/matches/${match.id}`} className="btn btn-primary btn-sm">
              Message
            </Link>
          ) : (
            isFriend && (
              <form action={openConversation.bind(null, userId)}>
                <button type="submit" className="btn btn-primary btn-sm">
                  Message
                </button>
              </form>
            )
          )}

          <FriendButton
            userId={userId}
            state={
              isFriend
                ? "friends"
                : friendship?.status === "PENDING"
                  ? friendship.requesterId === me
                    ? "requested"
                    : "incoming"
                  : "none"
            }
            friendshipId={friendship?.id ?? null}
          />

          <span className="ml-auto flex items-center gap-3">
            <BlockButton userId={userId} />
            <ReportDialog target={{ reportedUserId: userId }} />
          </span>
        </div>

        {/* ---------- stats ---------- */}
        <dl className="grid grid-cols-4 divide-x divide-[var(--line)] border-t border-[var(--line)] text-center">
          {[
            { label: "Posts", value: postCount },
            { label: "Friends", value: theirFriends.length },
            { label: "Mutual", value: mutuals.length },
            { label: "Photos", value: photos.length },
          ].map((stat) => (
            <div key={stat.label} className="py-3">
              <dd className="text-lg font-semibold">{stat.value}</dd>
              <dt className="hint">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {mutuals.length > 0 && (
        <p className="hint px-1">
          You have {mutuals.length} friend{mutuals.length === 1 ? "" : "s"} in
          common.
        </p>
      )}

      {/* ---------- about ---------- */}
      {user.profile.bio && (
        <section className="card p-4">
          <h2 className="text-sm font-medium">About</h2>
          <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--ink-muted)]">
            {user.profile.bio}
          </p>
          <p className="hint mt-3">
            On Gizycko since{" "}
            {user.createdAt.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
            {" · active "}
            {shortWhen(user.profile.lastActiveAt)} ago
          </p>
        </section>
      )}

      {/* ---------- photos ---------- */}
      {photoUrls.length > 0 && (
        <CollapsibleSection title="Photos" count={photoUrls.length} defaultOpen>
          <PhotoGrid photos={photoUrls} />
          <p className="hint mt-2">Tap a photo to see it full size.</p>
        </CollapsibleSection>
      )}

      {/* ---------- their friends ---------- */}
      <CollapsibleSection
        title="Friends"
        count={theirFriends.length}
        hint={mutuals.length > 0 ? `${mutuals.length} you know too` : undefined}
        defaultOpen={theirFriends.length > 0}
      >
        {theirFriends.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">No friends yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {orderedFriends.map((person) => {
              const name = person.profile?.displayName ?? person.name;
              return (
                <li key={person.id}>
                  <Link
                    href={`/u/${person.id}`}
                    className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-[var(--surface-muted)]"
                  >
                    <Avatar
                      name={name}
                      src={photoUrlOf(person.profile)}
                      size={36}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {name}
                      </span>
                      {mutualSet.has(person.id) && (
                        <span className="hint">Mutual friend</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      {/* ---------- posts ---------- */}
      <CollapsibleSection title="Posts" count={postCount} defaultOpen>
        {posts.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">
            {isFriend
              ? "Nothing posted yet."
              : "Nothing public to show. Add them as a friend to see more."}
          </p>
        ) : (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/feed/${post.id}`}
                  className="flex gap-3 rounded-xl p-2 hover:bg-[var(--surface-muted)]"
                >
                  {post.images[0] && (
                    <Image
                      src={post.images[0].url}
                      alt=""
                      width={64}
                      height={64}
                      className="size-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    {post.body && (
                      <span className="line-clamp-2 block text-sm whitespace-pre-wrap">
                        {post.body}
                      </span>
                    )}
                    <span className="hint mt-1 flex flex-wrap items-center gap-2">
                      <span>{shortWhen(post.createdAt)}</span>
                      <span>♥ {post._count.reactions}</span>
                      <span>💬 {post._count.comments}</span>
                      {post.videoUrl && <span>🎬 video</span>}
                      {post.audioUrl && <span>🎵 song</span>}
                    </span>
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
