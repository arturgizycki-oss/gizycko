import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/session";
import { shortWhen } from "@/lib/time";
import { removePost } from "../../moderation/actions";

/**
 * The newest posts and groups, for a look at what people are actually putting
 * on the site. Reports catch what members complain about; this catches what
 * nobody has complained about yet.
 */
export default async function AdminContentPage() {
  await requireModerator();

  const [posts, groups] = await Promise.all([
    prisma.post.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        body: true,
        createdAt: true,
        visibility: true,
        groupId: true,
        videoUrl: true,
        audioUrl: true,
        author: {
          select: {
            id: true,
            name: true,
            profile: { select: { displayName: true } },
          },
        },
        _count: { select: { images: true, comments: true, reactions: true } },
      },
    }),
    prisma.group.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        name: true,
        visibility: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            profile: { select: { displayName: true } },
          },
        },
        _count: { select: { members: true, posts: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-4">
      <section className="gh-box">
        <div className="gh-box-header">Newest posts</div>

        {posts.length === 0 ? (
          <p className="gh-row gh-muted">Nobody has posted yet.</p>
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
                <span className="gh-label">
                  {post.visibility.toLowerCase()}
                </span>
                {post.groupId && <span className="gh-label">group</span>}
                {post._count.images > 0 && (
                  <span className="gh-label">{post._count.images} photo</span>
                )}
                {post.videoUrl && <span className="gh-label">video</span>}
                {post.audioUrl && <span className="gh-label">song</span>}

                <span className="gh-muted flex-1 text-right">
                  {shortWhen(post.createdAt)}
                </span>

                <form action={removePost.bind(null, post.id)}>
                  <button type="submit" className="gh-btn gh-btn-danger">
                    Remove
                  </button>
                </form>
              </div>

              {post.body && (
                <p className="mt-1 line-clamp-2 text-sm">{post.body}</p>
              )}

              <p className="gh-muted mt-1">
                {post._count.reactions} likes &middot; {post._count.comments}{" "}
                comments
              </p>
            </div>
          ))
        )}
      </section>

      <section className="gh-box">
        <div className="gh-box-header">Newest groups</div>

        {groups.length === 0 ? (
          <p className="gh-row gh-muted">No groups yet.</p>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="gh-row flex flex-wrap items-center gap-2"
            >
              <Link
                href={`/groups/${group.id}`}
                className="gh-link font-semibold"
              >
                {group.name}
              </Link>
              <span className="gh-label">{group.visibility.toLowerCase()}</span>

              <span className="gh-muted min-w-0 flex-1 truncate">
                by {group.owner.profile?.displayName ?? group.owner.name}
                {" · "}
                {group._count.members} members {"·"} {group._count.posts} posts
              </span>

              <span className="gh-muted shrink-0">
                {shortWhen(group.createdAt)}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
