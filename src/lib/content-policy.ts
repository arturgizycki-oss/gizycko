/**
 * House rule: no sexual and no political content, anywhere people can write —
 * posts, comments, messages, bios, group names and descriptions.
 *
 * This is a word filter, and a word filter is a blunt instrument. It catches
 * the obvious and misses the oblique; someone determined will get past it with
 * spacing or synonyms. It exists to keep casual breaches out and to make the
 * rule visible, not to be a moderator. The report queue is the real backstop,
 * which is why a blocked attempt is also recorded for review.
 *
 * Ambiguous words are deliberately absent. "party", "date", "sexuality" and
 * similar have ordinary meanings on a dating site, and blocking them would
 * stop far more honest messages than bad ones.
 */

export type PolicyCategory = "SEXUAL" | "POLITICAL";

export type PolicyVerdict =
  | { ok: true }
  | { ok: false; category: PolicyCategory; message: string };

/** Explicit sexual terms, English and Polish. */
const SEXUAL = [
  "anal", "blowjob", "bukkake", "cock", "creampie", "cum", "cunnilingus",
  "cunt", "deepthroat", "dildo", "ejaculat", "erotic", "escort", "fellatio",
  "fetish", "fuck", "gangbang", "handjob", "hentai", "horny", "incest",
  "jerkoff", "masturbat", "milf", "nude", "nudes", "orgasm", "orgy", "porn",
  "pornhub", "pussy", "rimjob", "sexcam", "sexting", "sexchat", "slut",
  "sperm", "threesome", "titties", "twerk", "vagina", "whore", "xxx",
  // Polish
  "cipa", "chuj", "dziwk", "erotyczn", "jebac", "jeban", "kurw", "lechtaczk",
  "masturbac", "orgazm", "penis", "pierdol", "pornograf", "seksualn", "sperma",
  "wytrysk",
];

/** Party politics and hot-button political topics, English and Polish. */
const POLITICAL = [
  "abortion", "antifa", "brexit", "capitalism", "communism", "communist",
  "conservative", "coup", "dictator", "election", "electoral", "fascism",
  "fascist", "far-left", "far-right", "government", "immigration", "leftist",
  "liberal", "marxis", "nationalis", "nazi", "parliament", "politic",
  "president", "propaganda", "putin", "referendum", "republican", "rightwing",
  "leftwing", "senate", "socialism", "socialist", "trump", "ukraine", "voter",
  "zelensky",
  // Polish
  "aborcj", "faszyz", "komunizm", "konfederacj", "lewic", "nacjonaliz",
  "parlament", "pis-u", "platforma obywatelska", "polityk", "polityc", "prawic",
  "prezydent", "rzad polski", "sejm", "wybory", "wyborcz",
];

/** Strip diacritics and common letter-for-symbol swaps before matching. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[0@]/g, "o")
    .replace(/1|!/g, "i")
    .replace(/3/g, "e")
    .replace(/\$/g, "s")
    .replace(/[^a-z\s-]/g, " ");
}

function hit(text: string, terms: string[]): boolean {
  const normalised = normalise(text);

  return terms.some((term) => {
    // Terms ending mid-word (e.g. "politic") match any continuation, so
    // "politics" and "political" are both caught; the start is anchored to a
    // word boundary so "republican" does not fire inside an unrelated word.
    const pattern = new RegExp(`(^|[\\s-])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    return pattern.test(normalised);
  });
}

/** Check a piece of user text against the house rules. */
export function checkContent(text: string): PolicyVerdict {
  if (!text.trim()) return { ok: true };

  if (hit(text, SEXUAL)) {
    return {
      ok: false,
      category: "SEXUAL",
      message:
        "That reads as sexual content, which is not allowed here. Please rewrite it.",
    };
  }

  if (hit(text, POLITICAL)) {
    return {
      ok: false,
      category: "POLITICAL",
      message:
        "Politics is off-topic on Gizycko and not allowed. Please rewrite it.",
    };
  }

  return { ok: true };
}
