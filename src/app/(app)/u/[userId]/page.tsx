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
import { shortWhen, timeAgo } from "@/lib/time";
import { ReportDialog } from "@/components/report-dialog";
import { BlockButton } from "@/components/block-button";
import { Avatar } from "@/components/avatar";
import { CoverPhoto, PhotoGrid } from "@/components/photo-lightbox";
import { FriendButton } from "@/components/friend-button";
import { FollowButton } from "@/components/follow-button";
import { followCounts, isFollowing } from "@/lib/follows";
import { CollapsibleSection } from "@/components/collapsible-section";
import { ChatIcon, FilmIcon, HeartIcon, MusicIcon } from "@/components/icons";
import { openConversation } from "@/lib/actions/conversations";
import { getLocale, getTranslator } from "@/lib/i18n";
import { LocalTime } from "@/components/local-time";

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
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

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

  const [friends, matches, mutuals, counts, following, friendship, match] =
    await Promise.all([
      friendIds(me),
      matchedUserIds(me),
      mutualFriendIds(me, userId),
      followCounts(userId),
      isFollowing(me, userId),
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
      where: {
        authorId: userId,
        deletedAt: null,
        groupId: null,
        OR: postVisibility,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        body: true,
        createdAt: true,
        videoUrl: true,
        audioUrl: true,
        images: {
          select: { url: true },
          orderBy: { position: "asc" },
          take: 1,
        },
        _count: {
          select: {
            reactions: true,
            comments: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.post.count({
      where: {
        authorId: userId,
        deletedAt: null,
        groupId: null,
        OR: postVisibility,
      },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
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
  ]);

  /*
   * Their friends, minus anyone this viewer has blocked or been blocked by.
   *
   * The reader is not left out. They were, which made a profile whose only
   * friend is the person looking at it report none - and the count comes from
   * this same list, so it said "0 Friends" on a page reached from that very
   * friendship. Being someone's friend does not stop them having one.
   */
  const theirFriends = theirFriendships
    .map((row) => (row.requesterId === userId ? row.addressee : row.requester))
    .filter((person) => !hidden.includes(person.id));

  const mutualSet = new Set(mutuals);
  const orderedFriends = [
    ...theirFriends.filter((person) => mutualSet.has(person.id)),
    ...theirFriends.filter((person) => !mutualSet.has(person.id)),
  ];

  const photoUrls = photos.map((photo) => photo.url);

  return (
    <div className="space-y-4">
      {/* header */}
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
            <Link
              href={`/matches/${match.id}`}
              className="btn btn-primary btn-sm"
            >
              {t("action.message")}
            </Link>
          ) : (
            isFriend && (
              <form action={openConversation.bind(null, userId)}>
                <button type="submit" className="btn btn-primary btn-sm">
                  {t("action.message")}
                </button>
              </form>
            )
          )}

          <FollowButton userId={userId} following={following} />

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

        {/* stats */}
        <dl className="grid grid-cols-3 divide-[var(--line)] border-t border-[var(--line)] text-center sm:grid-cols-5 sm:divide-x">
          {[
            { label: t("profile.followers"), value: counts.followers },
            { label: t("profile.followingCount"), value: counts.following },
            { label: t("profile.posts"), value: postCount },
            { label: t("profile.friends"), value: theirFriends.length },
            { label: t("profile.mutual"), value: mutuals.length },
          ].map((stat) => (
            <div key={stat.label} className="py-3">
              <dd className="text-lg font-semibold">{stat.value}</dd>
              <dt className="hint">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* about */}
      {user.profile.bio && (
        <section className="card p-4">
          <h2 className="text-sm font-medium">{t("profile.about")}</h2>
          <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--ink-muted)]">
            {user.profile.bio}
          </p>
          <p className="hint mt-3">
            {t("profile.memberSince")}{" "}
            <LocalTime
              value={user.createdAt.toISOString()}
              locale={locale}
              mode="month"
            />
            {` · ${t("profile.active")} `}
            {timeAgo(user.profile.lastActiveAt)}
          </p>
        </section>
      )}

      {/* photos */}
      {photoUrls.length > 0 && (
        <CollapsibleSection
          title={t("profile.photos")}
          count={photoUrls.length}
          defaultOpen
        >
          <PhotoGrid photos={photoUrls} />
          <p className="hint mt-2">{t("profile.tapPhoto")}</p>
        </CollapsibleSection>
      )}

      {/* their friends */}
      <CollapsibleSection
        title={t("profile.friends")}
        count={theirFriends.length}
        hint={
          mutuals.length > 0
            ? `${mutuals.length} ${t("profile.youKnowToo")}`
            : undefined
        }
        defaultOpen={theirFriends.length > 0}
      >
        {theirFriends.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">{t("profile.noFriends")}</p>
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
                        <span className="hint">
                          {t("profile.mutualFriend")}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      {/* posts */}
      <CollapsibleSection
        title={t("profile.posts")}
        count={postCount}
        defaultOpen
      >
        {posts.length === 0 ? (
          <p className="muted px-2 py-3 text-sm">
            {isFriend ? t("profile.nothingPosted") : t("profile.nothingPublic")}
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
                      <span className="flex items-center gap-1">
                        <HeartIcon className="size-3.5" />
                        {post._count.reactions}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChatIcon className="size-3.5" />
                        {post._count.comments}
                      </span>
                      {post.videoUrl && (
                        <span className="flex items-center gap-1">
                          <FilmIcon className="size-3.5" />
                          {t("composer.video")}
                        </span>
                      )}
                      {post.audioUrl && (
                        <span className="flex items-center gap-1">
                          <MusicIcon className="size-3.5" />
                          {t("composer.song")}
                        </span>
                      )}
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
