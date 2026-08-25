import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_REGIONS,
  directionOf,
  findLocale,
} from "@/lib/i18n/locales";
import {
  DICTIONARIES,
  TRANSLATED_LOCALES,
  en,
  translate,
  type MessageKey,
} from "@/lib/i18n/dictionaries";

describe("the language list", () => {
  it("offers more than thirty languages", () => {
    expect(LOCALES.length).toBeGreaterThan(30);
  });

  it("covers every region the app claims to serve", () => {
    for (const region of LOCALE_REGIONS) {
      expect(LOCALES.some((locale) => locale.region === region)).toBe(true);
    }
  });

  it("has no duplicate codes", () => {
    const codes = LOCALES.map((locale) => locale.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("names every language in its own words", () => {
    for (const locale of LOCALES) {
      expect(locale.native.trim().length).toBeGreaterThan(0);
      expect(locale.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("includes the languages asked for by name", () => {
    for (const code of ["zh-Hans", "ja", "ar", "arz", "sw", "pt-BR", "es-MX"]) {
      expect(findLocale(code), code).not.toBeNull();
    }
  });

  it("defaults to a language that exists", () => {
    expect(findLocale(DEFAULT_LOCALE)).not.toBeNull();
  });
});

describe("writing direction", () => {
  it("flips for Arabic, Hebrew and Persian", () => {
    for (const code of ["ar", "arz", "he", "fa"]) {
      expect(directionOf(code), code).toBe("rtl");
    }
  });

  it("stays left to right for everything else", () => {
    for (const code of ["en", "pl", "ja", "zh-Hans", "sw"]) {
      expect(directionOf(code), code).toBe("ltr");
    }
  });

  it("treats an unknown language as left to right", () => {
    expect(directionOf("xx")).toBe("ltr");
  });
});

describe("translation", () => {
  const keys = Object.keys(en) as MessageKey[];

  it("returns the translation when there is one", () => {
    expect(translate("pl", "nav.feed")).toBe("Aktualności");
    expect(translate("ja", "menu.settings")).toBe("設定");
  });

  it("falls back to English for a language with no dictionary", () => {
    // Swahili is offered but not translated yet.
    expect(TRANSLATED_LOCALES.has("sw")).toBe(false);
    expect(translate("sw", "nav.feed")).toBe(en["nav.feed"]);
  });

  it("falls back to English for an unknown language", () => {
    expect(translate("xx", "nav.feed")).toBe(en["nav.feed"]);
  });

  it("never returns an empty string for any key in any offered language", () => {
    for (const locale of LOCALES) {
      for (const key of keys) {
        expect(translate(locale.code, key).trim(), `${locale.code}/${key}`)
          .not.toBe("");
      }
    }
  });

  it("only claims a language is translated if it has a dictionary", () => {
    for (const code of TRANSLATED_LOCALES) {
      expect(DICTIONARIES[code], code).toBeDefined();
    }
  });

  it("every translated language is one the picker offers", () => {
    for (const code of TRANSLATED_LOCALES) {
      expect(findLocale(code), code).not.toBeNull();
    }
  });
});
