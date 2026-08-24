import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { friendIds, hiddenUserIds, matchedUserIds } from "@/lib/social";
import { ageFrom } from "@/lib/age";
import { ReportDialog } from "@/components/report-dialog";
import { BlockButton } from "@/components/block-button";
import { PhotoPlaceholder } from "@/components/avatar";
import { FriendButton } from "@/components/friend-button";

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
      bannedAt: true,
      profile: {
        include: { photos: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!user?.profile || user.bannedAt) notFound();

  const [friends, matches, friendship, match] = await Promise.all([
    friendIds(me),
    matchedUserIds(me),
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

  const posts = await prisma.post.findMany({
    where: {
      authorId: userId,
      deletedAt: null,
      OR: [
        { visibility: "PUBLIC" as const },
        ...(isFriend ? [{ visibility: "FRIENDS" as const }] : []),
        ...(isMatched ? [{ visibility: "MATCHES" as const }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, body: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {user.profile.displayName}, {ageFrom(user.profile.birthDate)}
          </h1>
          <p className="text-sm text-neutral-500">
            {user.profile.city ?? "Somewhere"}
            {user.profile.occupation && ` · ${user.profile.occupation}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {match && (
            <Link
              href={`/matches/${match.id}`}
              className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white"
            >
              Message
            </Link>
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
          <BlockButton userId={userId} />
          <ReportDialog target={{ reportedUserId: userId }} />
        </div>
      </header>

      {photos.length === 0 ? (
        <PhotoPlaceholder
          name={user.profile.displayName}
          className="aspect-[16/9] w-full rounded-2xl"
        />
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="240px"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      )}

      {user.profile.bio && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-medium">About</h2>
          <p className="mt-2 text-sm whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
            {user.profile.bio}
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing public to show.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/feed/${post.id}`}
                  className="block rounded-xl border border-neutral-200 bg-white p-3 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                  <p className="line-clamp-3 whitespace-pre-wrap">{post.body}</p>
                  <time
                    dateTime={post.createdAt.toISOString()}
                    className="mt-1 block text-xs text-neutral-500"
                  >
                    {post.createdAt.toLocaleString()}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
