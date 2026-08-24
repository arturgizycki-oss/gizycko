import { describe, expect, it } from "vitest";
import { ALL_EMOJI, EMOJI_GROUPS, isEmojiOnly, QUICK_REACTIONS } from "@/lib/emoji";

describe("isEmojiOnly", () => {
  it("accepts a single emoji", () => {
    expect(isEmojiOnly("😀")).toBe(true);
  });

  it("accepts up to three, with whitespace around them", () => {
    expect(isEmojiOnly("😀😂🎉")).toBe(true);
    expect(isEmojiOnly("  😀 😂  ")).toBe(true);
  });

  it("rejects more than three, so a wall of emoji stays normal size", () => {
    expect(isEmojiOnly("😀😂🎉👍")).toBe(false);
  });

  it("counts a multi-codepoint emoji as one", () => {
    // Family and flag sequences are several codepoints joined by ZWJ.
    expect(isEmojiOnly("👩‍❤️‍👨")).toBe(true);
  });

  it("rejects anything with words in it", () => {
    expect(isEmojiOnly("hi 😀")).toBe(false);
    expect(isEmojiOnly("😀 ok")).toBe(false);
  });

  it("rejects plain text and empty input", () => {
    expect(isEmojiOnly("hello")).toBe(false);
    expect(isEmojiOnly("")).toBe(false);
    expect(isEmojiOnly("   ")).toBe(false);
  });

  it("rejects punctuation that is not an emoji", () => {
    expect(isEmojiOnly("!!!")).toBe(false);
    expect(isEmojiOnly("<3")).toBe(false);
  });

  it("honours a custom maximum", () => {
    expect(isEmojiOnly("😀😂🎉👍", 4)).toBe(true);
  });
});

describe("emoji data", () => {
  it("has no duplicates within a group", () => {
    for (const group of EMOJI_GROUPS) {
      expect(new Set(group.emoji).size).toBe(group.emoji.length);
    }
  });

  it("exposes every group's emoji in the flat list", () => {
    const counted = EMOJI_GROUPS.reduce((sum, g) => sum + g.emoji.length, 0);
    expect(ALL_EMOJI).toHaveLength(counted);
  });

  it("offers quick reactions that are themselves emoji-only", () => {
    for (const emoji of QUICK_REACTIONS) {
      expect(isEmojiOnly(emoji)).toBe(true);
    }
  });
});
