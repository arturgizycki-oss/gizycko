import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { friendIds, hiddenUserIds, matchedUserIds } from "@/lib/social";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { Composer } from "./composer";
import { PostCard } from "./post-card";

export default async function FeedPage() {
  const { session } = await requireProfile();
  const me = session.user.id;

  const [friends, hidden, matches] = await Promise.all([
    friendIds(me),
    hiddenUserIds(me),
    matchedUserIds(me),
  ]);

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      authorId: { notIn: hidden },
      OR: [
        { authorId: me },
        { visibility: "PUBLIC" },
        { visibility: "FRIENDS", authorId: { in: friends } },
        { visibility: "MATCHES", authorId: { in: matches } },
      ],
    },
    orderBy: { createdAt: "desc" },
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

  return (
    <div className="space-y-6">
      <Composer />

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Nothing here yet. Write the first post, or head to{" "}
          <span className="font-medium">Discover</span> to meet people.
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
