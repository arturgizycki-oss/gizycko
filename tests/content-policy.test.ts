import { describe, expect, it } from "vitest";
import { checkContent } from "@/lib/content-policy";

const blocked = (text: string) => checkContent(text).ok === false;
const category = (text: string) => {
  const verdict = checkContent(text);
  return verdict.ok ? null : verdict.category;
};

describe("sexual content", () => {
  it("blocks explicit terms", () => {
    expect(blocked("send me nudes")).toBe(true);
    expect(blocked("want to see some porn?")).toBe(true);
    expect(blocked("fuck off")).toBe(true);
  });

  it("blocks Polish terms", () => {
    expect(blocked("wyslij mi cos erotycznego")).toBe(true);
    expect(blocked("ty dziwko")).toBe(true);
  });

  it("sees through diacritics and digit swaps", () => {
    expect(blocked("p0rn")).toBe(true);
    expect(blocked("jebać")).toBe(true);
  });

  it("reports the category", () => {
    expect(category("send nudes")).toBe("SEXUAL");
  });
});

describe("political content", () => {
  it("blocks party politics", () => {
    expect(blocked("who did you vote for in the election?")).toBe(true);
    expect(blocked("this government is useless")).toBe(true);
    expect(blocked("rozmawiajmy o polityce")).toBe(true);
  });

  it("reports the category", () => {
    expect(category("the election was rigged")).toBe("POLITICAL");
  });
});

/**
 * The filter is only worth having if ordinary messages get through. These are
 * the sentences a dating site is actually full of.
 */
describe("ordinary messages are not blocked", () => {
  const fine = [
    "Fancy a coffee on Saturday?",
    "I love sailing on Niegocin in the summer.",
    "There is a house party on Friday, want to come?",
    "What are you up to this weekend?",
    "I am a nurse, I work nights at the hospital.",
    "My date last week went badly, ha.",
    "I like cooking, climbing, and terrible films.",
    "Cześć! Jak leci? Może kawa w sobotę?",
    "Jestem z Giżycka, pracuję w szkole.",
    "Photography is my thing — mostly landscapes.",
    "I have two cats and no self-control at the bakery.",
    "Do you want to meet at the marina at six?",
  ];

  for (const text of fine) {
    it(`allows: ${text.slice(0, 42)}`, () => {
      expect(checkContent(text).ok).toBe(true);
    });
  }
});

describe("edge cases", () => {
  it("allows empty and whitespace", () => {
    expect(checkContent("").ok).toBe(true);
    expect(checkContent("   ").ok).toBe(true);
  });

  it("does not fire on a banned term buried inside an unrelated word", () => {
    // "scunthorpe problem": a substring match here would block a real place.
    expect(checkContent("I grew up near Scunthorpe.").ok).toBe(true);
    expect(checkContent("We went to Essex for the weekend.").ok).toBe(true);
  });
});
