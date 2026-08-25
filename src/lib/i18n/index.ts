import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, directionOf, findLocale } from "./locales";
import { translate, type MessageKey } from "./dictionaries";

export const LOCALE_COOKIE = "gizycko_locale";

/** Best guess at a visitor's language from the browser's Accept-Language. */
function fromAcceptLanguage(header: string | null): string | null {
  if (!header) return null;

  const wanted = header
    .split(",")
    .map((part) => part.split(";")[0].trim())
    .filter(Boolean);

  for (const tag of wanted) {
    // Exact match first ("pt-BR"), then the base language ("pt").
    if (findLocale(tag)) return tag;
    const base = tag.split("-")[0];
    if (findLocale(base)) return base;
  }

  return null;
}

/**
 * The language to render in.
 *
 * A signed-in member's saved choice wins, because it followed them from
 * whatever device they set it on. Otherwise a cookie, so a signed-out visitor
 * who picks a language keeps it. Otherwise what their browser asks for.
 *
 * Cached per request: the layout and the page it renders resolve it once.
 */
export const getLocale = cache(async (): Promise<string> => {
  const session = await getSession();

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { locale: true },
    });
    if (user && findLocale(user.locale)) return user.locale;
  }

  const store = await cookies();
  const saved = store.get(LOCALE_COOKIE)?.value;
  if (findLocale(saved)) return saved!;

  const requested = fromAcceptLanguage((await headers()).get("accept-language"));
  return requested ?? DEFAULT_LOCALE;
});

/**
 * A translator bound to this request's language.
 *
 * `const t = await getTranslator()` then `t("nav.feed")`.
 */
export async function getTranslator() {
  const locale = await getLocale();
  return (key: MessageKey) => translate(locale, key);
}

/** Language and writing direction, for the <html> element. */
export async function getDocumentLanguage() {
  const locale = await getLocale();
  return { locale, dir: directionOf(locale) };
}

export type { MessageKey };
