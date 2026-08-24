import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { ageFrom } from "@/lib/age";
import { ReportDialog } from "@/components/report-dialog";
import { BlockButton } from "@/components/block-button";
import { Chat } from "./chat";
import { markRead, unmatch } from "./actions";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const { session } = await requireProfile();
  const me = session.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: { select: { id: true, name: true, profile: true } },
      userB: { select: { id: true, name: true, profile: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });

  if (!match || (match.userAId !== me && match.userBId !== me)) notFound();

  const other = match.userAId === me ? match.userB : match.userA;

  await markRead(matchId);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/matches" className="text-sm text-neutral-500 hover:underline">
            ← Matches
          </Link>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            {other.profile?.displayName ?? other.name}
            {other.profile && `, ${ageFrom(other.profile.birthDate)}`}
          </h1>
          {other.profile?.city && (
            <p className="text-sm text-neutral-500">{other.profile.city}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {!match.unmatchedAt && (
            <form action={unmatch.bind(null, matchId)}>
              <button type="submit" className="text-xs text-neutral-500 hover:text-rose-600">
                Unmatch
              </button>
            </form>
          )}
          <BlockButton userId={other.id} />
          <ReportDialog target={{ reportedUserId: other.id }} />
        </div>
      </header>

      <Chat
        matchId={matchId}
        closed={match.unmatchedAt !== null}
        messages={match.messages.map((message) => ({
          id: message.id,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
          mine: message.senderId === me,
        }))}
      />
    </div>
  );
}
