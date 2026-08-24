import Image from "next/image";
import { toggleReaction } from "./actions";

type PostCardProps = {
  post: {
    id: string;
    body: string;
    createdAt: Date;
    authorName: string;
    authorImage: string | null;
    images: string[];
    reactionCount: number;
    commentCount: number;
    reactedByMe: boolean;
  };
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex items-center gap-3">
        <div className="size-9 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          {post.authorImage && (
            <Image
              src={post.authorImage}
              alt=""
              width={36}
              height={36}
              className="size-full object-cover"
            />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{post.authorName}</p>
          <time
            dateTime={post.createdAt.toISOString()}
            className="text-xs text-neutral-500"
          >
            {post.createdAt.toLocaleString()}
          </time>
        </div>
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
        <span className="text-neutral-500">💬 {post.commentCount}</span>
      </footer>
    </article>
  );
}
