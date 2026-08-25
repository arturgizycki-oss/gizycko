import { beforeAll, describe, expect, it, vi, afterEach } from "vitest";

let realtime: typeof import("@/lib/realtime");

beforeAll(async () => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-topic-derivation";
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_example";
  realtime = await import("@/lib/realtime");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the topic a member listens on", () => {
  it("is the same every time, so a reconnect rejoins the same channel", () => {
    expect(realtime.topicFor("user-1")).toBe(realtime.topicFor("user-1"));
  });

  it("differs between members", () => {
    expect(realtime.topicFor("user-1")).not.toBe(realtime.topicFor("user-2"));
  });

  /*
   * The whole reason this is derived rather than `user:<id>`. Supabase topics
   * are open to anybody holding the publishable key, which is a browser key, so
   * a guessable name would let a stranger watch when somebody is being written
   * to. The id must not be recoverable from the topic.
   */
  it("does not carry the member's id", () => {
    const topic = realtime.topicFor("cm4abcdefghijklmnop");

    expect(topic).not.toContain("cm4abcdefghijklmnop");
    expect(topic).toMatch(/^u_[0-9a-f]{32}$/);
  });

  it("cannot be worked out without the secret", async () => {
    const before = realtime.topicFor("user-1");

    vi.resetModules();
    process.env.BETTER_AUTH_SECRET = "a-different-secret";
    const other = await import("@/lib/realtime");

    expect(other.topicFor("user-1")).not.toBe(before);

    vi.resetModules();
    process.env.BETTER_AUTH_SECRET = "test-secret-for-topic-derivation";
    realtime = await import("@/lib/realtime");
  });
});

describe("pushing", () => {
  it("sends the kind of change and nothing else", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return Promise.resolve(new Response("", { status: 202 }));
    });

    await realtime.pushToUser("user-1", "message");

    expect(calls[0].url).toBe(
      "https://project.supabase.co/realtime/v1/api/broadcast",
    );

    const body = JSON.parse(String(calls[0].init.body));
    expect(body.messages[0].payload).toEqual({ kind: "message" });
    // Content would be readable by anyone subscribed to the topic.
    expect(JSON.stringify(body)).not.toContain("user-1");
  });

  /*
   * A push that fails must not fail the write that caused it. The client polls
   * as well, so a dropped broadcast delays an update rather than losing it.
   */
  it("stays quiet when the broadcast is refused", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(new Response("nope", { status: 500 })),
    );

    await expect(
      realtime.pushToUser("user-1", "notification"),
    ).resolves.toBeUndefined();
  });

  it("stays quiet when the network is down", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));

    await expect(realtime.pushToFeed()).resolves.toBeUndefined();
  });

  it("does nothing at all when Supabase is not configured", async () => {
    vi.resetModules();
    const url = process.env.SUPABASE_URL;
    delete process.env.SUPABASE_URL;

    const unconfigured = await import("@/lib/realtime");
    const fetched = vi.fn();
    vi.stubGlobal("fetch", fetched);

    await unconfigured.pushToFeed();
    expect(fetched).not.toHaveBeenCalled();

    process.env.SUPABASE_URL = url;
  });
});
