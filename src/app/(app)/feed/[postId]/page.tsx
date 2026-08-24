import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { friendIds, hiddenUserIds, matchedUserIds } from "@/lib/social";
import { ReportDialog } from "@/components/report-dialog";
import { CommentForm } from "./comment-form";
import { deleteComment } from "../actions";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const { session } = await requireProfile();
  const me = session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      },
    },
  });

  if (!post || post.deletedAt) notFound();

  const [hidden, friends, matches] = await Promise.all([
    hiddenUserIds(me),
    friendIds(me),
    matchedUserIds(me),
  ]);

  // A block hides that person's comments here too, not just their posts.
  const comments = post.comments.filter(
    (comment) => !hidden.includes(comment.authorId),
  );

  const canSee =
    post.authorId === me ||
    (!hidden.includes(post.authorId) &&
      (post.visibility === "PUBLIC" ||
        (post.visibility === "FRIENDS" && friends.includes(post.authorId)) ||
        (post.visibility === "MATCHES" && matches.includes(post.authorId))));

  if (!canSee) notFound();

  const authorName = post.author.profile?.displayName ?? post.author.name;

  return (
    <div className="space-y-6">
      <Link href="/feed" className="text-sm text-neutral-500 hover:underline">
        ← Feed
      </Link>

      <article className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <header className="flex items-start justify-between">
          <div>
            <Link href={`/u/${post.author.id}`} className="text-sm font-medium hover:underline">
              {authorName}
            </Link>
            <time
              dateTime={post.createdAt.toISOString()}
              className="block text-xs text-neutral-500"
            >
              {post.createdAt.toLocaleString()}
            </time>
          </div>
          {post.authorId !== me && (
            <ReportDialog target={{ postId: post.id }} />
          )}
        </header>

        <p className="mt-3 text-sm whitespace-pre-wrap">{post.body}</p>
      </article>

      <section>
        <h2 className="mb-3 text-sm font-medium">
          {comments.filter((c) => !c.deletedAt).length} comments
        </h2>

        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              {comment.deletedAt ? (
                <p className="text-sm text-neutral-400 italic">
                  This comment was deleted.
                </p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/u/${comment.author.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {comment.author.profile?.displayName ?? comment.author.name}
                    </Link>
                    <div className="flex items-center gap-3">
                      {comment.authorId === me ? (
                        <form action={deleteComment.bind(null, comment.id)}>
                          <button
                            type="submit"
                            className="text-xs text-neutral-500 hover:text-rose-600"
                          >
                            Delete
                          </button>
                        </form>
                      ) : (
                        <ReportDialog target={{ commentId: comment.id }} />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{comment.body}</p>
                  <time
                    dateTime={comment.createdAt.toISOString()}
                    className="mt-1 block text-xs text-neutral-500"
                  >
                    {comment.createdAt.toLocaleString()}
                  </time>
                </>
              )}
            </li>
          ))}
        </ul>

        <CommentForm postId={post.id} />
      </section>
    </div>
  );
}
