"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";
import { LOCALES, LOCALE_REGIONS } from "@/lib/i18n/locales";
import { useT } from "@/lib/i18n/provider";

/**
 * Language chooser, grouped by region and labelled in each language's own
 * words - somebody looking for Polish is looking for "Polski", not "Polish".
 *
 * Languages without a translation yet are marked, rather than quietly showing
 * English and leaving the person wondering whether it failed.
 */
export function LanguagePicker({
  current,
  translated,
  untranslatedLabel,
}: {
  current: string;
  translated: string[];
  untranslatedLabel: string;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const covered = new Set(translated);

  return (
    <select
      value={current}
      disabled={pending}
      aria-label={t("settings.language")}
      onChange={(event) => {
        const code = event.target.value;
        startTransition(() => setLocale(code));
      }}
      className="input max-w-xs"
    >
      {LOCALE_REGIONS.map((region) => (
        <optgroup key={region} label={region}>
          {LOCALES.filter((locale) => locale.region === region).map(
            (locale) => (
              <option key={locale.code} value={locale.code}>
                {locale.native}
                {locale.native !== locale.name ? ` - ${locale.name}` : ""}
                {covered.has(locale.code) ? "" : ` (${untranslatedLabel})`}
              </option>
            ),
          )}
        </optgroup>
      ))}
    </select>
  );
}
