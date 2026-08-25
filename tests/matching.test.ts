import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { orderPair, recordSwipe } from "@/lib/matching";
import { friendIds, hiddenUserIds, matchedUserIds } from "@/lib/social";

/**
 * These run against the local Postgres from `npm run db`. Every fixture id is
 * prefixed so cleanup never touches seeded or real rows.
 */
const PREFIX = "test-match-";

const A = `${PREFIX}a`;
const B = `${PREFIX}b`;
const C = `${PREFIX}c`;

async function makeUser(id: string) {
  await prisma.user.create({
    data: {
      id,
      name: id,
      email: `${id}@test.invalid`,
      emailVerified: true,
    },
  });
}

async function wipe() {
  await prisma.user.deleteMany({ where: { id: { startsWith: PREFIX } } });
}

beforeEach(async () => {
  await wipe();
  await Promise.all([makeUser(A), makeUser(B), makeUser(C)]);
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});


const onlyFixtures = { userAId: { startsWith: PREFIX } };
const fixtureMatches = () => prisma.match.count({ where: onlyFixtures });
const fixtureNotifications = (type?: "MATCH" | "PROFILE_LIKE") =>
  prisma.notification.count({
    where: { userId: { startsWith: PREFIX }, ...(type ? { type } : {}) },
  });
const fixtureSwipes = () =>
  prisma.swipe.count({ where: { fromUserId: { startsWith: PREFIX } } });

describe("orderPair", () => {
  it("gives the same order whichever way round it is asked", () => {
    expect(orderPair("z", "a")).toEqual(["a", "z"]);
    expect(orderPair("a", "z")).toEqual(["a", "z"]);
  });
});

describe("recordSwipe", () => {
  it("does not match on a one-sided like", async () => {
    const result = await recordSwipe(A, B, "LIKE");

    expect(result.matched).toBe(false);
    expect(await fixtureMatches()).toBe(0);
  });

  it("matches when the like is returned", async () => {
    await recordSwipe(A, B, "LIKE");
    const result = await recordSwipe(B, A, "LIKE");

    expect(result.matched).toBe(true);
    expect(await fixtureMatches()).toBe(1);
  });

  it("tells the other person about a like that did not match", async () => {
    await recordSwipe(A, B, "LIKE");

    const notification = await prisma.notification.findFirst({
      where: { userId: B, type: "PROFILE_LIKE" },
      select: { actorId: true },
    });

    // Without this a one-sided like is silent, and B never learns of it.
    expect(notification?.actorId).toBe(A);
  });

  it("says nothing about a pass", async () => {
    await recordSwipe(A, B, "PASS");

    expect(await fixtureNotifications("PROFILE_LIKE")).toBe(0);
  });

  it("announces a like once, however often it is re-swiped", async () => {
    await recordSwipe(A, B, "LIKE");
    await recordSwipe(A, B, "PASS");
    await recordSwipe(A, B, "LIKE");
    await recordSwipe(A, B, "SUPERLIKE");

    expect(await fixtureNotifications("PROFILE_LIKE")).toBe(1);
  });

  it("does not tap a member on the shoulder who blocked you", async () => {
    await prisma.block.create({ data: { blockerId: B, blockedId: A } });

    await recordSwipe(A, B, "LIKE");

    expect(await fixtureNotifications("PROFILE_LIKE")).toBe(0);
  });

  /*
   * The earlier like is redundant once the match exists, and would otherwise
   * sit under it in the list still asking to be acted on.
   */
  it("clears the earlier like once it becomes a match", async () => {
    await recordSwipe(A, B, "LIKE");
    expect(await fixtureNotifications("PROFILE_LIKE")).toBe(1);

    await recordSwipe(B, A, "LIKE");

    expect(await fixtureNotifications("PROFILE_LIKE")).toBe(0);
    expect(await fixtureNotifications("MATCH")).toBe(2);
  });

  it("never matches a pass", async () => {
    await recordSwipe(A, B, "LIKE");
    const result = await recordSwipe(B, A, "PASS");

    expect(result.matched).toBe(false);
    expect(await fixtureMatches()).toBe(0);
  });

  it("treats a superlike as a like", async () => {
    await recordSwipe(A, B, "SUPERLIKE");
    const result = await recordSwipe(B, A, "LIKE");

    expect(result.matched).toBe(true);
  });

  it("lets a pass be changed to a like later", async () => {
    await recordSwipe(A, B, "PASS");
    await recordSwipe(B, A, "LIKE");
    const result = await recordSwipe(A, B, "LIKE");

    expect(result.matched).toBe(true);
    expect(await prisma.swipe.count({ where: { fromUserId: A, toUserId: B } })).toBe(1);
  });

  it("keeps one match row and notifies only once, however often people re-swipe", async () => {
    await recordSwipe(A, B, "LIKE");
    const first = await recordSwipe(B, A, "LIKE");

    await recordSwipe(A, B, "LIKE");
    await recordSwipe(B, A, "LIKE");
    const again = await recordSwipe(A, B, "LIKE");

    expect(again.matchId).toBe(first.matchId);
    expect(await fixtureMatches()).toBe(1);
    expect(await fixtureNotifications("MATCH")).toBe(2);
  });

  it("ignores a self-swipe", async () => {
    const result = await recordSwipe(A, A, "LIKE");

    expect(result.matched).toBe(false);
    expect(await fixtureSwipes()).toBe(0);
  });

  it("notifies both people when a match is made", async () => {
    await recordSwipe(A, B, "LIKE");
    await recordSwipe(B, A, "LIKE");

    const recipients = await prisma.notification.findMany({
      where: { type: "MATCH", userId: { startsWith: PREFIX } },
      select: { userId: true },
    });

    expect(recipients.map((n) => n.userId).sort()).toEqual([A, B].sort());
  });
});

describe("social lookups", () => {
  it("reports matched users from either side of the pair", async () => {
    await recordSwipe(A, B, "LIKE");
    await recordSwipe(B, A, "LIKE");

    expect(await matchedUserIds(A)).toEqual([B]);
    expect(await matchedUserIds(B)).toEqual([A]);
  });

  it("leaves out a match that was ended", async () => {
    await recordSwipe(A, B, "LIKE");
    await recordSwipe(B, A, "LIKE");
    await prisma.match.updateMany({ where: onlyFixtures, data: { unmatchedAt: new Date() } });

    expect(await matchedUserIds(A)).toEqual([]);
  });

  it("hides a blocked user from both directions", async () => {
    await prisma.block.create({ data: { blockerId: A, blockedId: C } });

    expect(await hiddenUserIds(A)).toEqual([C]);
    expect(await hiddenUserIds(C)).toEqual([A]);
    expect(await hiddenUserIds(B)).toEqual([]);
  });

  it("counts a friendship from either side, once accepted", async () => {
    await prisma.friendship.create({
      data: { requesterId: A, addresseeId: B, status: "ACCEPTED" },
    });
    await prisma.friendship.create({
      data: { requesterId: A, addresseeId: C, status: "PENDING" },
    });

    expect(await friendIds(A)).toEqual([B]);
    expect(await friendIds(B)).toEqual([A]);
    expect(await friendIds(C)).toEqual([]);
  });
});
