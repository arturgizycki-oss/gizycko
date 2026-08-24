import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ReportDialog } from "@/components/report-dialog";
import { deletePost, toggleReaction } from "./actions";

type PostCardProps = {
  post: {
    id: string;
    authorId: string;
    body: string;
    createdAt: Date;
    authorName: string;
    authorImage: string | null;
    images: string[];
    reactionCount: number;
    commentCount: number;
    reactedByMe: boolean;
  };
  isMine: boolean;
};

export function PostCard({ post, isMine }: PostCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={post.authorName} src={post.authorImage} size={36} />
          <div>
            <Link
              href={`/u/${post.authorId}`}
              className="text-sm font-medium hover:underline"
            >
              {post.authorName}
            </Link>
            <time
              dateTime={post.createdAt.toISOString()}
              className="block text-xs text-neutral-500"
            >
              {post.createdAt.toLocaleString()}
            </time>
          </div>
        </div>

        {isMine ? (
          <form action={deletePost.bind(null, post.id)}>
            <button
              type="submit"
              className="text-xs text-neutral-500 hover:text-rose-600"
            >
              Delete
            </button>
          </form>
        ) : (
          <ReportDialog target={{ postId: post.id }} />
        )}
      </header>

      <p className="mt-3 text-sm whitespace-pre-wrap">{post.body}</p>

      {post.images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.images.map((url) => (
            <Image
              key={url}
              src={url}
              alt=""
              width={400}
              height={400}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-3 text-sm dark:border-neutral-800">
        <form action={toggleReaction.bind(null, post.id)}>
          <button
            type="submit"
            className={
              post.reactedByMe
                ? "font-medium text-rose-600"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }
          >
            ♥ {post.reactionCount}
          </button>
        </form>
        <Link
          href={`/feed/${post.id}`}
          className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          💬 {post.commentCount}
        </Link>
      </footer>
    </article>
  );
}
