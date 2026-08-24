import { describe, expect, it } from "vitest";
import { ageFrom, isAdult, MIN_AGE } from "@/lib/age";

const NOW = new Date("2026-08-24T12:00:00Z");

describe("ageFrom", () => {
  it("counts whole years", () => {
    expect(ageFrom(new Date("1990-08-24"), NOW)).toBe(36);
    expect(ageFrom(new Date("2000-01-01"), NOW)).toBe(26);
  });

  it("does not count a birthday that has not happened yet this year", () => {
    expect(ageFrom(new Date("1990-08-25"), NOW)).toBe(35);
    expect(ageFrom(new Date("1990-12-31"), NOW)).toBe(35);
  });

  it("counts the birthday itself", () => {
    expect(ageFrom(new Date("2008-08-24"), NOW)).toBe(18);
  });
});

describe("isAdult", () => {
  it("accepts someone who turned 18 today", () => {
    expect(isAdult(new Date("2008-08-24"), NOW)).toBe(true);
  });

  it("rejects someone one day short of 18", () => {
    expect(isAdult(new Date("2008-08-25"), NOW)).toBe(false);
  });

  it("rejects a clearly underage date", () => {
    expect(isAdult(new Date("2015-01-01"), NOW)).toBe(false);
  });

  it("uses the documented minimum", () => {
    expect(MIN_AGE).toBe(18);
  });
});
