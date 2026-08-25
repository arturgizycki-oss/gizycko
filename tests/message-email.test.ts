import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

/**
 * Runs against the local Postgres from `npm run db`, so the rules are checked
 * against the real query rather than a guess at what it returns. The mail
 * provider is the one thing stubbed - these must not send anything.
 */
const sent: { to: string; subject: string; text: string }[] = [];

vi.mock("@/lib/mail", () => ({
  sendMail: vi.fn(async (mail) => {
    sent.push(mail);
  }),
}));

const { emailAboutMessage } = await import("@/lib/message-email");

const PREFIX = "test-mailnudge-";
const RECIPIENT = `${PREFIX}recipient`;

const minutesAgo = (n: number) => new Date(Date.now() - n * 60 * 1000);

/** A member who has been away long enough to be worth emailing. */
async function makeRecipient(
  overrides: {
    locale?: string;
    emailOnMessage?: boolean;
    emailVerified?: boolean;
    bannedAt?: Date | null;
    messageEmailAt?: Date | null;
    lastActiveAt?: Date;
  } = {},
) {
  await prisma.user.create({
    data: {
      id: RECIPIENT,
      name: RECIPIENT,
      email: `${RECIPIENT}@test.invalid`,
      emailVerified: overrides.emailVerified ?? true,
      locale: overrides.locale ?? "en",
      emailOnMessage: overrides.emailOnMessage ?? true,
      messageEmailAt: overrides.messageEmailAt ?? null,
      bannedAt: overrides.bannedAt ?? null,
      profile: {
        create: {
          displayName: "Recipient",
          birthDate: new Date("1990-01-01"),
          gender: "WOMAN",
          interestedIn: ["MAN"],
          lastActiveAt: overrides.lastActiveAt ?? minutesAgo(60),
        },
      },
    },
  });
}

async function wipe() {
  await prisma.user.deleteMany({ where: { id: { startsWith: PREFIX } } });
}

beforeEach(async () => {
  sent.length = 0;
  await wipe();
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe("emailing somebody about a waiting message", () => {
  it("writes to a member who has been away", async () => {
    await makeRecipient();

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(`${RECIPIENT}@test.invalid`);
    expect(sent[0].subject).toContain("Ania");
    expect(sent[0].text).toContain("/matches/match-1");
  });

  /*
   * The rule that matters most. lastActiveAt is only written every ten minutes,
   * so somebody reading the chat right now can still look stale by nine - which
   * is why the threshold is fifteen and not five.
   */
  it("stays quiet while the member is still on the site", async () => {
    await makeRecipient({ lastActiveAt: minutesAgo(9) });

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");

    expect(sent).toHaveLength(0);
  });

  it("sends one nudge an hour, not one a message", async () => {
    await makeRecipient();

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");
    await emailAboutMessage(RECIPIENT, "Ania", "match-1");
    await emailAboutMessage(RECIPIENT, "Borys", "match-2");

    expect(sent).toHaveLength(1);
  });

  it("writes again once the quiet hour is up", async () => {
    await makeRecipient({ messageEmailAt: minutesAgo(90) });

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");

    expect(sent).toHaveLength(1);
  });

  it("respects the setting", async () => {
    await makeRecipient({ emailOnMessage: false });

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");

    expect(sent).toHaveLength(0);
  });

  it("leaves an unconfirmed address alone", async () => {
    // They cannot sign in yet, so there is nothing to come back to.
    await makeRecipient({ emailVerified: false });

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");

    expect(sent).toHaveLength(0);
  });

  it("leaves a banned member alone", async () => {
    await makeRecipient({ bannedAt: new Date() });

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");

    expect(sent).toHaveLength(0);
  });

  it("writes in the member's own language", async () => {
    await makeRecipient({ locale: "pl" });

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");

    expect(sent[0].subject).toBe("Nowa wiadomość od Ania");
  });

  it("records the send, so the next message does not repeat it", async () => {
    await makeRecipient();

    await emailAboutMessage(RECIPIENT, "Ania", "match-1");

    const after = await prisma.user.findUnique({
      where: { id: RECIPIENT },
      select: { messageEmailAt: true },
    });
    expect(after?.messageEmailAt).not.toBeNull();
  });

  /*
   * A message that was delivered must not report failure because a mail
   * provider was briefly down, so this swallows everything.
   */
  it("says nothing about a member who no longer exists", async () => {
    await expect(
      emailAboutMessage(`${PREFIX}gone`, "Ania", "match-1"),
    ).resolves.toBeUndefined();
    expect(sent).toHaveLength(0);
  });
});
