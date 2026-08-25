import { Suspense } from "react";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { unreadMessageCount } from "@/lib/messages";
import { AppBackdrop } from "@/components/app-backdrop";
import { RouteProgress } from "@/components/route-progress";
import { Brand } from "@/components/brand";
import { BottomNav, NavIconLink, NavLinks } from "@/components/nav-links";
import { BellIcon } from "@/components/icons";
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

  const navLabels = {
    feed: t("nav.feed"),
    discover: t("nav.discover"),
    matches: t("nav.matches"),
    messages: t("nav.messages"),
    friends: t("nav.friends"),
    groups: t("nav.groups"),
  };

  return (
    <div className="relative min-h-dvh">
      <AppBackdrop />

      {/* useSearchParams needs a boundary; the bar renders nothing until a click. */}
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>

      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_85%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <Brand href="/feed" size={26} />

          <NavLinks unreadMessages={unreadMessages} labels={navLabels} />

          {/* Holds the bell and avatar against the right edge on a phone,
                where the labelled nav above renders nothing. */}
          <span className="flex-1 sm:hidden" />

          <NavIconLink href="/notifications" label={t("nav.notifications")}>
            <BellIcon className="size-5 text-[var(--ink-muted)]" />
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

      {/* pb-24 clears the bottom bar, which only exists below `sm`. */}
      <main className="relative mx-auto max-w-3xl px-3 pt-6 pb-24 sm:px-4 sm:py-8">
        {children}
      </main>

      {/*
          Outside the header on purpose: the header's backdrop-blur would become
          the containing block for anything fixed inside it.
        */}
      <BottomNav unreadMessages={unreadMessages} labels={navLabels} />
    </div>
  );
}
