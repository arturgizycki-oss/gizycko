import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { UnblockButton } from "./unblock-button";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

export default async function BlockedPage() {
  const { session } = await requireProfile();

  const blocks = await prisma.block.findMany({
    where: { blockerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      blocked: {
        select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
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
        <p className="empty-state">
          You have not blocked anyone.
        </p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="card flex items-center gap-3 p-3"
            >
              <Avatar
                name={block.blocked.profile?.displayName ?? block.blocked.name}
                src={photoUrlOf(block.blocked.profile)}
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
