import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { UnblockButton } from "./unblock-button";
import { getLocale, getTranslator } from "@/lib/i18n";
import { ChevronLeftIcon } from "@/components/icons";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

export default async function BlockedPage() {
  const { session } = await requireProfile();
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

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
      <Link
        href="/settings"
        className="text-sm text-neutral-500 hover:underline"
      >
        <ChevronLeftIcon className="size-4" />
        {t("settings.title")}
      </Link>

      <h1 className="mt-2 mb-6 text-xl font-semibold tracking-tight">
        {t("settings.blocked")}
      </h1>

      <p className="hint mb-4">{t("settings.blockedHint")}</p>

      {blocks.length === 0 ? (
        <p className="empty-state">{t("settings.blockedEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((block) => (
            <li key={block.id} className="card flex items-center gap-3 p-3">
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
                  {t("settings.blockedSince")}{" "}
                  {block.createdAt.toLocaleDateString(locale)}
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
