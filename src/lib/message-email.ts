import { prisma } from "./prisma";
import { sendMail } from "./mail";
import { translate } from "./i18n/dictionaries";

/**
 * Tell someone by email that a message is waiting.
 *
 * A message inside the site only reaches a member who comes back on their own.
 * Every messaging product people actually answer - WhatsApp, Messenger - reaches
 * out instead of waiting to be visited, and that is the difference between a
 * conversation continuing tomorrow and never.
 *
 * Two rules keep it from becoming a nuisance, which is the failure mode that
 * gets a sender marked as spam and takes the verification emails down with it.
 */

/*
 * Long enough that nobody using the site is ever emailed about it.
 *
 * lastActiveAt is only written every ten minutes (see touchLastActive), so
 * somebody reading the chat right now may still look ten minutes stale. Fifteen
 * clears that with room to spare.
 */
const AWAY_AFTER_MS = 15 * 60 * 1000;

/** At most one nudge an hour, however many messages arrive in it. */
const QUIET_PERIOD_MS = 60 * 60 * 1000;

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "https://gizycko.online"
  );
}

/**
 * Send the nudge, or decide not to. Safe to call on every message.
 *
 * Never throws: a message that was delivered must not report failure because
 * an email provider was briefly down. Call it from `after()` so the sender is
 * not kept waiting on it either.
 */
export async function emailAboutMessage(
  recipientId: string,
  senderName: string,
  matchId: string,
): Promise<void> {
  try {
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        email: true,
        locale: true,
        bannedAt: true,
        emailVerified: true,
        emailOnMessage: true,
        messageEmailAt: true,
        profile: { select: { lastActiveAt: true } },
      },
    });

    if (!recipient) return;
    if (!recipient.emailOnMessage) return;
    // An unconfirmed address cannot sign in, so it has nothing to come back to.
    if (!recipient.emailVerified) return;
    if (recipient.bannedAt) return;

    const now = Date.now();

    const lastActive = recipient.profile?.lastActiveAt;
    if (lastActive && now - lastActive.getTime() < AWAY_AFTER_MS) return;

    const lastEmail = recipient.messageEmailAt;
    if (lastEmail && now - lastEmail.getTime() < QUIET_PERIOD_MS) return;

    const line = (key: Parameters<typeof translate>[1]) =>
      translate(recipient.locale, key).replace("{name}", senderName);

    await sendMail({
      to: recipient.email,
      subject: line("email.newMessageSubject"),
      text: [
        line("email.newMessageBody"),
        "",
        `${translate(recipient.locale, "email.newMessageOpen")} ${siteUrl()}/matches/${matchId}`,
        "",
        translate(recipient.locale, "email.newMessageWhy"),
      ].join("\n"),
    });

    // Stamped after the send, so a provider outage does not start the quiet
    // period and swallow the next hour's worth of nudges too.
    await prisma.user.update({
      where: { id: recipientId },
      data: { messageEmailAt: new Date() },
    });
  } catch (cause) {
    console.error("Could not email about a message", { recipientId, cause });
  }
}
