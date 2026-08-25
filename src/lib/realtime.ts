import { createHmac } from "node:crypto";

/**
 * Live updates, pushed rather than polled.
 *
 * The shape here is deliberate and worth reading before changing it.
 *
 * A broadcast carries no content - only the name of the thing that changed.
 * Supabase topics are open: anyone holding the publishable key, which is a
 * browser key and therefore public by definition, may subscribe to any topic
 * they can name. Putting a message in the payload would hand it to whoever
 * listened. Saying only "something of this kind is new" and letting the client
 * fetch it through the application keeps every permission check we already have.
 *
 * Per-member topics are derived, not guessable. `user:<id>` would let anybody
 * who has seen a profile URL watch that member's activity - not their messages,
 * but when they are being written to, which is its own kind of surveillance.
 * The name is an HMAC instead, so only the server can work out anybody's topic,
 * and it hands each member their own.
 */

/** What changed. The client decides what to re-fetch. */
export type LiveEvent = "message" | "notification" | "feed";

/** Everyone's feed. Nothing to protect: it says only that somebody posted. */
export const FEED_TOPIC = "feed";

function secret(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set");
  return value;
}

/**
 * The topic a member listens on. Stable for them, opaque to everybody else.
 *
 * Reuses the auth secret rather than asking for another one to configure: it
 * is already required, already secret, and already rotated when that matters.
 */
export function topicFor(userId: string): string {
  const digest = createHmac("sha256", secret())
    .update(`realtime:${userId}`)
    .digest("hex");

  return `u_${digest.slice(0, 32)}`;
}

/**
 * Tell a topic that something happened. Never throws.
 *
 * A push that fails must not fail the write that caused it. The client polls as
 * well - slowly - so a missed broadcast delays an update rather than losing it,
 * and that is the property that makes this safe to add.
 */
export async function push(topic: string, event: LiveEvent): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const response = await fetch(
      `${url.replace(/\/+$/, "")}/realtime/v1/api/broadcast`,
      {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ topic, event: "changed", payload: { kind: event } }],
        }),
      },
    );

    if (!response.ok) {
      console.error("Realtime push refused", {
        topic,
        status: response.status,
      });
    }
  } catch (cause) {
    console.error("Realtime push failed", { topic, cause });
  }
}

/** Nudge one member. */
export function pushToUser(userId: string, event: LiveEvent): Promise<void> {
  return push(topicFor(userId), event);
}

/** Nudge everybody looking at a feed. */
export function pushToFeed(): Promise<void> {
  return push(FEED_TOPIC, "feed");
}
