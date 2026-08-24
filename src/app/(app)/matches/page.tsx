import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

export default async function MatchesPage() {
  const { session } = await requireProfile();
  const me = session.user.id;

  const matches = await prisma.match.findMany({
    where: {
      unmatchedAt: null,
      OR: [{ userAId: me }, { userBId: me }],
    },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    include: {
      userA: { select: { id: true, name: true, profile: { select: PROFILE_AVATAR } } },
      userB: { select: { id: true, name: true, profile: { select: PROFILE_AVATAR } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Matches</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Your conversations. Tap a name to open the chat, or the photo to see
        their profile.
      </p>

      {matches.length === 0 ? (
        <p className="empty-state">
          No matches yet, so there is nobody to message. Keep swiping in
          Discover — a conversation opens as soon as you both like each other.
        </p>
      ) : (
        <ul className="card divide-y divide-[var(--line)] overflow-hidden">
          {matches.map((match) => {
            const other = match.userAId === me ? match.userB : match.userA;
            const preview = match.messages[0];

            return (
              <li
                key={match.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <Link
                  href={`/u/${other.id}`}
                  aria-label={`${other.profile?.displayName ?? other.name}'s profile`}
                >
                  <Avatar
                    name={other.profile?.displayName ?? other.name}
                    src={photoUrlOf(other.profile)}
                    size={40}
                  />
                </Link>
                <Link href={`/matches/${match.id}`} className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {other.profile?.displayName ?? other.name}
                  </p>
                  <p className="truncate text-sm text-neutral-500">
                    {preview ? preview.body : "You matched. Say hello."}
                  </p>
                </Link>
                <Link
                  href={`/matches/${match.id}`}
                  className="btn btn-primary btn-sm shrink-0"
                >
                  Message
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
