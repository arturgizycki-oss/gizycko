export type LocaleRegion = "Europe" | "Americas" | "Africa" | "Middle East" | "Asia";

export type Locale = {
  /** BCP 47 tag, and the key a dictionary file is named after. */
  code: string;
  /** English name, for our own lists and logs. */
  name: string;
  /** What speakers call it — what the picker shows. */
  native: string;
  region: LocaleRegion;
  /** Written right to left, so the page direction flips. */
  rtl?: true;
};

/**
 * Languages offered in the picker.
 *
 * Listing a language is a promise the app *works* in it — the direction is
 * right, dates and numbers format correctly, nothing overflows. It is not a
 * promise every string is translated: a locale with no dictionary falls back to
 * English, and the picker says so rather than pretending otherwise.
 */
export const LOCALES: Locale[] = [
  // Europe
  { code: "en", name: "English", native: "English", region: "Europe" },
  { code: "pl", name: "Polish", native: "Polski", region: "Europe" },
  { code: "de", name: "German", native: "Deutsch", region: "Europe" },
  { code: "fr", name: "French", native: "Français", region: "Europe" },
  { code: "es", name: "Spanish", native: "Español", region: "Europe" },
  { code: "it", name: "Italian", native: "Italiano", region: "Europe" },
  { code: "pt", name: "Portuguese", native: "Português", region: "Europe" },
  { code: "nl", name: "Dutch", native: "Nederlands", region: "Europe" },
  { code: "sv", name: "Swedish", native: "Svenska", region: "Europe" },
  { code: "nb", name: "Norwegian", native: "Norsk", region: "Europe" },
  { code: "da", name: "Danish", native: "Dansk", region: "Europe" },
  { code: "fi", name: "Finnish", native: "Suomi", region: "Europe" },
  { code: "is", name: "Icelandic", native: "Íslenska", region: "Europe" },
  { code: "cs", name: "Czech", native: "Čeština", region: "Europe" },
  { code: "sk", name: "Slovak", native: "Slovenčina", region: "Europe" },
  { code: "hu", name: "Hungarian", native: "Magyar", region: "Europe" },
  { code: "ro", name: "Romanian", native: "Română", region: "Europe" },
  { code: "bg", name: "Bulgarian", native: "Български", region: "Europe" },
  { code: "el", name: "Greek", native: "Ελληνικά", region: "Europe" },
  { code: "hr", name: "Croatian", native: "Hrvatski", region: "Europe" },
  { code: "sr", name: "Serbian", native: "Српски", region: "Europe" },
  { code: "sl", name: "Slovenian", native: "Slovenščina", region: "Europe" },
  { code: "uk", name: "Ukrainian", native: "Українська", region: "Europe" },
  { code: "ru", name: "Russian", native: "Русский", region: "Europe" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių", region: "Europe" },
  { code: "lv", name: "Latvian", native: "Latviešu", region: "Europe" },
  { code: "et", name: "Estonian", native: "Eesti", region: "Europe" },
  { code: "tr", name: "Turkish", native: "Türkçe", region: "Europe" },
  { code: "ga", name: "Irish", native: "Gaeilge", region: "Europe" },

  // Americas
  { code: "pt-BR", name: "Portuguese (Brazil)", native: "Português (Brasil)", region: "Americas" },
  { code: "es-MX", name: "Spanish (Mexico)", native: "Español (México)", region: "Americas" },
  { code: "fr-CA", name: "French (Canada)", native: "Français (Canada)", region: "Americas" },
  { code: "ht", name: "Haitian Creole", native: "Kreyòl ayisyen", region: "Americas" },
  { code: "qu", name: "Quechua", native: "Runa Simi", region: "Americas" },

  // Africa
  { code: "sw", name: "Swahili", native: "Kiswahili", region: "Africa" },
  { code: "am", name: "Amharic", native: "አማርኛ", region: "Africa" },
  { code: "ha", name: "Hausa", native: "Hausa", region: "Africa" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", region: "Africa" },
  { code: "ig", name: "Igbo", native: "Igbo", region: "Africa" },
  { code: "zu", name: "Zulu", native: "isiZulu", region: "Africa" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", region: "Africa" },
  { code: "so", name: "Somali", native: "Soomaali", region: "Africa" },

  // Middle East — right to left
  { code: "ar", name: "Arabic", native: "العربية", region: "Middle East", rtl: true },
  { code: "arz", name: "Egyptian Arabic", native: "مصرى", region: "Middle East", rtl: true },
  { code: "he", name: "Hebrew", native: "עברית", region: "Middle East", rtl: true },
  { code: "fa", name: "Persian", native: "فارسی", region: "Middle East", rtl: true },

  // Asia
  { code: "zh-Hans", name: "Chinese (Simplified)", native: "简体中文", region: "Asia" },
  { code: "zh-Hant", name: "Chinese (Traditional)", native: "繁體中文", region: "Asia" },
  { code: "ja", name: "Japanese", native: "日本語", region: "Asia" },
  { code: "ko", name: "Korean", native: "한국어", region: "Asia" },
  { code: "hi", name: "Hindi", native: "हिन्दी", region: "Asia" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", region: "Asia" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", region: "Asia" },
];

export const DEFAULT_LOCALE = "en";

const BY_CODE = new Map(LOCALES.map((locale) => [locale.code, locale]));

export function findLocale(code: string | null | undefined): Locale | null {
  if (!code) return null;
  return BY_CODE.get(code) ?? null;
}

/** "rtl" for Arabic, Hebrew and Persian; "ltr" for everything else. */
export function directionOf(code: string): "ltr" | "rtl" {
  return findLocale(code)?.rtl ? "rtl" : "ltr";
}

export const LOCALE_REGIONS: LocaleRegion[] = [
  "Europe",
  "Americas",
  "Africa",
  "Middle East",
  "Asia",
];
