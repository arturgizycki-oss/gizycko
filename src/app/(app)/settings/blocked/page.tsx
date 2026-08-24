import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { UnblockButton } from "./unblock-button";

export default async function BlockedPage() {
  const { session } = await requireProfile();

  const blocks = await prisma.block.findMany({
    where: { blockerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      blocked: {
        select: { id: true, name: true, profile: { select: { displayName: true } } },
      },
    },
  });

  return (
    <div>
      <Link href="/profile" className="text-sm text-neutral-500 hover:underline">
        ← Profile
      </Link>

      <h1 className="mt-2 mb-6 text-xl font-semibold tracking-tight">
        Blocked people
      </h1>

      {blocks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          You have not blocked anyone.
        </p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Avatar
                name={block.blocked.profile?.displayName ?? block.blocked.name}
                size={40}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {block.blocked.profile?.displayName ?? block.blocked.name}
                </p>
                <p className="text-xs text-neutral-500">
                  blocked {block.createdAt.toLocaleDateString()}
                </p>
              </div>
              <UnblockButton userId={block.blocked.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
