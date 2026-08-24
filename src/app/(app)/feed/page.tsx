import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { friendIds, hiddenUserIds, matchedUserIds } from "@/lib/social";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import type { Prisma } from "@/generated/prisma/client";
import { Composer } from "./composer";
import { FeedFilters } from "./feed-filters";
import { PostCard } from "./post-card";

type Search = Record<string, string | string[] | undefined>;

/** Read one search param, falling back when it is absent or unrecognised. */
function pick(search: Search, key: string, allowed: string[], fallback: string) {
  const raw = search[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && allowed.includes(value) ? value : fallback;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { session } = await requireProfile();
  const me = session.user.id;

  const search = await searchParams;
  const sort = pick(search, "sort", ["new", "top", "discussed"], "new");
  const source = pick(search, "from", ["all", "friends", "matches", "mine"], "all");
  const kind = pick(search, "has", ["all", "photos", "video", "song"], "all");

  const [friends, hidden, matches] = await Promise.all([
    friendIds(me),
    hiddenUserIds(me),
    matchedUserIds(me),
  ]);

  // What this user is allowed to see at all.
  const visibleToMe: Prisma.PostWhereInput = {
    deletedAt: null,
    authorId: { notIn: hidden },
    OR: [
      { authorId: me },
      { visibility: "PUBLIC" },
      { visibility: "FRIENDS", authorId: { in: friends } },
      { visibility: "MATCHES", authorId: { in: matches } },
    ],
  };

  // Narrowed by whose posts they asked for. AND-ed with the rule above rather
  // than merged, so a filter can never widen what is visible.
  const bySource: Prisma.PostWhereInput =
    source === "friends"
      ? { authorId: { in: friends } }
      : source === "matches"
        ? { authorId: { in: matches } }
        : source === "mine"
          ? { authorId: me }
          : {};

  const byKind: Prisma.PostWhereInput =
    kind === "photos"
      ? { images: { some: {} } }
      : kind === "video"
        ? { videoUrl: { not: null } }
        : kind === "song"
          ? { audioUrl: { not: null } }
          : {};

  const where: Prisma.PostWhereInput = { AND: [visibleToMe, bySource, byKind] };

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    sort === "top"
      ? [{ reactions: { _count: "desc" } }, { createdAt: "desc" }]
      : sort === "discussed"
        ? [{ comments: { _count: "desc" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

  const posts = await prisma.post.findMany({
    where,
    orderBy,
    take: 30,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              displayName: true,
              photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
            },
          },
        },
      },
      images: { orderBy: { position: "asc" } },
      reactions: { where: { userId: me }, select: { id: true } },
      _count: {
        select: {
          reactions: true,
          // Soft-deleted comments must not inflate the count on the card.
          comments: { where: { deletedAt: null } },
        },
      },
    },
  });

  const filtered = source !== "all" || kind !== "all";

  return (
    <div className="space-y-6">
      <Composer />

      <FeedFilters sort={sort} source={source} kind={kind} total={posts.length} />

      {posts.length === 0 ? (
        <p className="empty-state">
          {filtered ? (
            "Nothing matches those filters. Try widening them."
          ) : (
            <>
              Nothing here yet. Write the first post, or head to{" "}
              <span className="font-medium">Discover</span> to meet people.
            </>
          )}
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
                isMine={post.authorId === me}
                post={{
                  id: post.id,
                  authorId: post.authorId,
                  body: post.body,
                  createdAt: post.createdAt,
                  authorName:
                    post.author.profile?.displayName ?? post.author.name,
                  authorImage:
                    photoUrlOf(post.author.profile) ?? post.author.image,
                  images: post.images.map((image) => image.url),
                  videoUrl: post.videoUrl,
                  audioUrl: post.audioUrl,
                  audioTitle: post.audioTitle,
                  reactionCount: post._count.reactions,
                  commentCount: post._count.comments,
                  reactedByMe: post.reactions.length > 0,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
