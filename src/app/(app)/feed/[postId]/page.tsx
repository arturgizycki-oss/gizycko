import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { friendIds, hiddenUserIds, matchedUserIds } from "@/lib/social";
import { ReportDialog } from "@/components/report-dialog";
import { CommentForm } from "./comment-form";
import { deleteComment } from "../actions";
import { MusicIcon } from "@/components/icons";
import { CopyLink } from "@/components/copy-link";
import { getLocale, getTranslator } from "@/lib/i18n";
import { ChevronLeftIcon } from "@/components/icons";
import { ConfirmButton } from "@/components/confirm-button";

/** How many comments one page loads. */
const MAX_COMMENTS = 200;

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const { session } = await requireProfile();
  const me = session.user.id;
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

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
      images: { orderBy: { position: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: MAX_COMMENTS,
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

  // Group posts live on their group page, which is where their audience and
  // their moderation rules are. Sending them here would show them stripped of
  // both.
  if (post.groupId) redirect(`/groups/${post.groupId}`);

  const [hidden, friends, matches] = await Promise.all([
    hiddenUserIds(me),
    friendIds(me),
    matchedUserIds(me),
  ]);

  // A block hides that person's comments here too, not just their posts.
  const hiddenSet = new Set(hidden);
  const comments = post.comments.filter(
    (comment) => !hiddenSet.has(comment.authorId),
  );

  const canSee =
    post.authorId === me ||
    (!hiddenSet.has(post.authorId) &&
      (post.visibility === "PUBLIC" ||
        (post.visibility === "FRIENDS" && friends.includes(post.authorId)) ||
        (post.visibility === "MATCHES" && matches.includes(post.authorId))));

  if (!canSee) notFound();

  const authorName = post.author.profile?.displayName ?? post.author.name;

  return (
    <div className="space-y-6">
      <Link href="/feed" className="text-sm text-neutral-500 hover:underline">
        <ChevronLeftIcon className="size-4" />
        {t("nav.feed")}
      </Link>

      <article className="card p-4">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/u/${post.author.id}`}
              className="text-sm font-medium hover:underline"
            >
              {authorName}
            </Link>
            <time
              dateTime={post.createdAt.toISOString()}
              className="block text-xs text-neutral-500"
            >
              {post.createdAt.toLocaleString(locale)}
            </time>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <CopyLink path={`/feed/${post.id}`} label={t("action.share")} />
            {post.authorId !== me && (
              <ReportDialog target={{ postId: post.id }} />
            )}
          </div>
        </header>

        {post.body && (
          <p className="mt-3 text-sm whitespace-pre-wrap">{post.body}</p>
        )}

        {post.images.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {post.images.map((image) => (
              <li
                key={image.id}
                className="relative overflow-hidden rounded-xl"
              >
                <Image
                  src={image.url}
                  alt=""
                  width={800}
                  height={800}
                  sizes="(max-width: 768px) 50vw, 320px"
                  className="aspect-square w-full object-cover"
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
            {t("chat.noVideo")}
          </video>
        )}

        {post.audioUrl && (
          <figure className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
            <figcaption className="mb-2 flex items-center gap-2 text-xs font-medium">
              <MusicIcon className="size-3.5 shrink-0" />
              <span className="truncate">
                {post.audioTitle ?? t("feed.attachedSong")}
              </span>
            </figcaption>
            <audio
              controls
              preload="none"
              src={post.audioUrl}
              className="w-full"
            >
              {t("chat.noAudio")}
            </audio>
          </figure>
        )}
      </article>

      <section>
        <h2 className="mb-3 text-sm font-medium">
          {comments.filter((c) => !c.deletedAt).length}{" "}
          {t("feed.commentsCount")}
        </h2>

        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="card p-3">
              {comment.deletedAt ? (
                <p className="text-sm text-neutral-400 italic">
                  {t("feed.commentDeleted")}
                </p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/u/${comment.author.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {comment.author.profile?.displayName ??
                        comment.author.name}
                    </Link>
                    <div className="flex items-center gap-3">
                      {comment.authorId === me ? (
                        <ConfirmButton
                          label={t("action.delete")}
                          question={t("confirm.deleteComment")}
                          destructive
                          formAction={deleteComment.bind(null, comment.id)}
                        />
                      ) : (
                        <ReportDialog target={{ commentId: comment.id }} />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {comment.body}
                  </p>
                  <time
                    dateTime={comment.createdAt.toISOString()}
                    className="mt-1 block text-xs text-neutral-500"
                  >
                    {comment.createdAt.toLocaleString(locale)}
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
