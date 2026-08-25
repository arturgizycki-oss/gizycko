import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { DangerZone } from "../profile/danger-zone";
import { LanguagePicker } from "@/components/language-picker";
import { getLocale, getTranslator } from "@/lib/i18n";
import { TRANSLATED_LOCALES } from "@/lib/i18n/dictionaries";
import { ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { session, profile } = await requireProfile();

  const [locale, t] = await Promise.all([getLocale(), getTranslator()]);

  const [blockedCount, user] = await Promise.all([
    prisma.block.count({ where: { blockerId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">
        {t("settings.title")}
      </h1>

      <section className="card p-4">
        <h2 className="text-sm font-medium">{t("settings.account")}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="muted">{t("settings.email")}</dt>
            <dd className="truncate">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted">{t("settings.emailConfirmed")}</dt>
            <dd>
              {user?.emailVerified
                ? t("settings.emailYes")
                : t("settings.emailNo")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted">{t("settings.memberSince")}</dt>
            <dd>
              {/* Formatted in the member's own language, not the server's. */}
              {user?.createdAt.toLocaleDateString(locale, {
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-medium">{t("settings.language")}</h2>
        <p className="hint mt-1">{t("settings.languageHint")}</p>
        <div className="mt-3">
          <LanguagePicker
            current={locale}
            translated={[...TRANSLATED_LOCALES]}
            untranslatedLabel={t("language.untranslated")}
          />
        </div>
      </section>

      <section className="card divide-y divide-[var(--line)]">
        <h2 className="px-4 pt-4 pb-2 text-sm font-medium">
          {t("settings.privacy")}
        </h2>

        <SettingsLink
          href="/profile"
          title={t("settings.editProfile")}
          detail={t("settings.editProfileHint")}
        />
        <SettingsLink
          href="/settings/blocked"
          title={t("settings.blocked")}
          detail={
            blockedCount === 0 ? t("settings.blockedNone") : `${blockedCount}`
          }
        />
        <SettingsLink
          href="/profile"
          title={t("settings.visibility")}
          detail={
            profile.isVisible
              ? t("settings.visibilityShown")
              : t("settings.visibilityHidden")
          }
        />
      </section>

      <section className="card divide-y divide-[var(--line)]">
        <h2 className="px-4 pt-4 pb-2 text-sm font-medium">
          {t("settings.reading")}
        </h2>
        <SettingsLink
          href="/terms"
          title={t("settings.terms")}
          detail={t("settings.termsHint")}
        />
        <SettingsLink
          href="/privacy"
          title={t("settings.privacyPolicy")}
          detail={t("settings.privacyPolicyHint")}
        />
        <SettingsLink
          href="/safety"
          title={t("settings.safety")}
          detail={t("settings.safetyHint")}
        />
      </section>

      <DangerZone />
    </div>
  );
}

function SettingsLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-muted)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="hint">{detail}</span>
      </span>
      <ChevronRightIcon className="muted size-4 shrink-0" />
    </Link>
  );
}
