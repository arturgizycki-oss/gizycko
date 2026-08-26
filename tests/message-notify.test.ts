import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { worthNotifying } from "@/lib/message-notify";

const PREFIX = "test-notify-";
const A = `${PREFIX}sender`;
const B = `${PREFIX}reader`;

let matchId: string;

const minutesAgo = (n: number) => new Date(Date.now() - n * 60 * 1000);

async function makeUser(id: string) {
  await prisma.user.create({
    data: { id, name: id, email: `${id}@test.invalid`, emailVerified: true },
  });
}

/** A message from A, optionally already read by B at a given moment. */
async function sent(readAt: Date | null) {
  await prisma.message.create({
    data: { matchId, senderId: A, body: "hello", readAt },
  });
}

async function waitingNotification() {
  await prisma.notification.create({
    data: { userId: B, type: "MESSAGE", actorId: A, entityId: matchId },
  });
}

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await makeUser(A);
  await makeUser(B);

  const [userAId, userBId] = A < B ? [A, B] : [B, A];
  const match = await prisma.match.create({ data: { userAId, userBId } });
  matchId = match.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.$disconnect();
});

describe("whether a message is worth a notification", () => {
  it("announces the first message of a conversation", async () => {
    // Nothing has been read here, so there is no reason to think anybody is
    // watching, and this is the message that needs to reach them.
    expect(await worthNotifying(matchId, A, B)).toBe(true);
  });

  /*
   * The case this exists for. Reading a conversation while the other person
   * types put a badge on the bell for a message already on screen, which then
   * had to be cleared by hand.
   */
  it("stays quiet while the other person has the chat open", async () => {
    await sent(new Date());

    expect(await worthNotifying(matchId, A, B)).toBe(false);
  });

  it("announces again once they have been gone a while", async () => {
    await sent(minutesAgo(10));

    expect(await worthNotifying(matchId, A, B)).toBe(true);
  });

  it("does not count a message they have not read", async () => {
    await sent(null);

    expect(await worthNotifying(matchId, A, B)).toBe(true);
  });

  /*
   * Five messages in a row used to leave five identical lines saying the same
   * person wrote, which stops the list being a summary of anything.
   */
  it("does not stack a second notification on an unread one", async () => {
    await waitingNotification();

    expect(await worthNotifying(matchId, A, B)).toBe(false);
  });

  it("announces again once the waiting one has been read", async () => {
    await prisma.notification.create({
      data: {
        userId: B,
        type: "MESSAGE",
        actorId: A,
        entityId: matchId,
        readAt: new Date(),
      },
    });

    expect(await worthNotifying(matchId, A, B)).toBe(true);
  });

  it("ignores an unread notification about a different conversation", async () => {
    await prisma.notification.create({
      data: { userId: B, type: "MESSAGE", actorId: A, entityId: "other-match" },
    });

    expect(await worthNotifying(matchId, A, B)).toBe(true);
  });
});
