import { Suspense } from "react";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { unreadMessageCount } from "@/lib/messages";
import { AppBackdrop } from "@/components/app-backdrop";
import { RouteProgress } from "@/components/route-progress";
import { Brand } from "@/components/brand";
import { NavIconLink, NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { getTranslator } from "@/lib/i18n";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const t = await getTranslator();

  const [unread, unreadMessages, profile] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
    unreadMessageCount(session.user.id),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        displayName: true,
        photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
      },
    }),
  ]);

  return (
    <div className="relative min-h-dvh">
      <AppBackdrop />

      {/* useSearchParams needs a boundary; the bar renders nothing until a click. */}
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>

      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_85%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <Brand href="/feed" size={26} />

          <NavLinks
            unreadMessages={unreadMessages}
            labels={{
              feed: t("nav.feed"),
              discover: t("nav.discover"),
              matches: t("nav.matches"),
              messages: t("nav.messages"),
              friends: t("nav.friends"),
              groups: t("nav.groups"),
            }}
          />

          <NavIconLink href="/notifications" label={t("nav.notifications")}>
            <span className="text-lg leading-none">🔔</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </NavIconLink>

          <UserMenu
            name={profile?.displayName ?? session.user.name}
            photo={photoUrlOf(profile) ?? session.user.image ?? null}
            labels={{
              account: t("nav.account"),
              profile: t("menu.profile"),
              settings: t("menu.settings"),
              help: t("menu.help"),
              logout: t("menu.logout"),
            }}
          />
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
