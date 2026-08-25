import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { shortWhen } from "@/lib/time";
import { removePost } from "../moderation/actions";

/**
 * Songs and videos members have attached to posts, newest first, playable in
 * place so a moderator can judge them without leaving the page.
 *
 * Posts only. The same files can also be sent in a private chat, and a
 * moderator browsing private messages for something to look at is not
 * moderation - those surface here only when somebody reports them.
 */
export async function MediaReview({ kind }: { kind: "audio" | "video" }) {
  const isAudio = kind === "audio";

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      ...(isAudio ? { audioUrl: { not: null } } : { videoUrl: { not: null } }),
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      id: true,
      body: true,
      createdAt: true,
      visibility: true,
      groupId: true,
      audioUrl: true,
      audioTitle: true,
      videoUrl: true,
      author: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true } },
        },
      },
    },
  });

  return (
    <section className="gh-box">
      <div className="gh-box-header">
        {posts.length} {isAudio ? "song" : "video"}
        {posts.length === 1 ? "" : "s"}
      </div>

      {posts.length === 0 ? (
        <p className="gh-row gh-muted">
          Nobody has posted {isAudio ? "a song" : "a video"} yet.
        </p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="gh-row">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/u/${post.author.id}`}
                className="gh-link font-semibold"
              >
                {post.author.profile?.displayName ?? post.author.name}
              </Link>

              <span className="gh-label">{post.visibility.toLowerCase()}</span>
              {post.groupId && <span className="gh-label">group</span>}

              <span className="gh-muted flex-1 text-right">
                {shortWhen(post.createdAt)}
              </span>

              <Link href={`/feed/${post.id}`} className="gh-link text-xs">
                Open
              </Link>

              <form action={removePost.bind(null, post.id)}>
                <button type="submit" className="gh-btn gh-btn-danger">
                  Remove
                </button>
              </form>
            </div>

            {post.body && (
              <p className="mt-1 line-clamp-2 text-sm">{post.body}</p>
            )}

            <div className="mt-2">
              {isAudio ? (
                <>
                  {post.audioTitle && (
                    <p className="gh-muted mb-1 truncate">{post.audioTitle}</p>
                  )}
                  <audio
                    controls
                    preload="none"
                    src={post.audioUrl ?? undefined}
                    className="w-full max-w-md"
                  />
                </>
              ) : (
                <video
                  controls
                  preload="metadata"
                  src={post.videoUrl ?? undefined}
                  className="max-h-64 w-full max-w-md rounded-md bg-black"
                />
              )}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
