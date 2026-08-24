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
    videoUrl: string | null;
    audioUrl: string | null;
    audioTitle: string | null;
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
          <Link href={`/u/${post.authorId}`} aria-label={post.authorName}>
            <Avatar name={post.authorName} src={post.authorImage} size={36} />
          </Link>
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
        <ul
          className={
            post.images.length === 1
              ? "mt-3 grid grid-cols-1 gap-2"
              : "mt-3 grid grid-cols-2 gap-2"
          }
        >
          {post.images.map((url) => (
            <li key={url} className="relative overflow-hidden rounded-xl">
              <Image
                src={url}
                alt=""
                width={800}
                height={800}
                sizes="(max-width: 768px) 100vw, 640px"
                className={
                  post.images.length === 1
                    ? "max-h-[28rem] w-full object-cover"
                    : "aspect-square w-full object-cover"
                }
              />
            </li>
          ))}
        </ul>
      )}

      {post.videoUrl && (
        <video
          controls
          preload="metadata"
          src={post.videoUrl}
          className="mt-3 max-h-[28rem] w-full rounded-xl bg-black"
        >
          Your browser cannot play this video.
        </video>
      )}

      {post.audioUrl && (
        <figure className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
          <figcaption className="mb-2 flex items-center gap-2 text-xs font-medium">
            <span aria-hidden>🎵</span>
            <span className="truncate">{post.audioTitle ?? "Attached song"}</span>
          </figcaption>
          <audio controls preload="none" src={post.audioUrl} className="w-full">
            Your browser cannot play this audio.
          </audio>
        </figure>
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
