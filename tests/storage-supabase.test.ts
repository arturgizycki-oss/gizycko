import { describe, expect, it, beforeAll, afterEach, vi } from "vitest";

let driver: typeof import("@/lib/storage-supabase");

beforeAll(async () => {
  process.env.SUPABASE_URL = "https://project.supabase.co/";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_example";
  process.env.SUPABASE_STORAGE_BUCKET = "media";
  driver = await import("@/lib/storage-supabase");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stand in for the network and record what the driver asked for. */
function captureFetch(response: Response) {
  const calls: { url: string; init: RequestInit }[] = [];

  vi.stubGlobal("fetch", (url: string, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    return Promise.resolve(response.clone());
  });

  return calls;
}

function headersOf(init: RequestInit): Record<string, string> {
  return (init.headers ?? {}) as Record<string, string>;
}

describe("the Supabase storage driver", () => {
  /*
   * Supabase's newer keys are not JWTs. Sent only as a Bearer token they come
   * back as 403 "Invalid Compact JWS", which took every upload on the live site
   * down while every local test still passed, because development writes to
   * disk and never touches this driver at all.
   */
  it("sends the key as apikey, not only as a Bearer token", async () => {
    const calls = captureFetch(new Response("", { status: 200 }));

    await driver.putObject("images/u1/a.png", Buffer.from("x"));

    expect(headersOf(calls[0].init).apikey).toBe("sb_secret_example");
  });

  it("authenticates every request, not just uploads", async () => {
    const calls = captureFetch(
      new Response("body", { status: 200, headers: { "content-length": "4" } }),
    );

    await driver.statObject("images/u1/a.png");
    await driver.streamObject("images/u1/a.png");
    await driver.deleteObject("images/u1/a.png");

    expect(calls).toHaveLength(3);
    for (const call of calls) {
      expect(headersOf(call.init).apikey).toBe("sb_secret_example");
    }
  });

  it("builds the object URL without doubling the API prefix", async () => {
    const calls = captureFetch(new Response("", { status: 200 }));

    await driver.deleteObject("images/u1/a.png");

    expect(calls[0].url).toBe(
      "https://project.supabase.co/storage/v1/object/media/images/u1/a.png",
    );
  });

  it("escapes a key that carries a space or an accent", async () => {
    const calls = captureFetch(new Response("", { status: 200 }));

    await driver.deleteObject("images/u1/zdjecie lato.png");

    expect(calls[0].url).toContain("zdjecie%20lato.png");
  });

  /*
   * Supabase has returned this path both with and without the "/storage/v1"
   * prefix. Joining it blindly produces ".../storage/v1/storage/v1/..." and a
   * signed URL that 404s only in production.
   */
  it("absorbs a signed path that already carries the API prefix", async () => {
    captureFetch(
      Response.json({
        url: "/storage/v1/object/upload/sign/media/images/u1/a.png?token=abc",
        token: "abc",
      }),
    );

    const signed = await driver.signedUploadUrl("images/u1/a.png");

    expect(signed.url).toBe(
      "https://project.supabase.co/storage/v1/object/upload/sign/media/images/u1/a.png?token=abc",
    );
    expect(signed.token).toBe("abc");
  });

  it("accepts a signed path given without the prefix", async () => {
    captureFetch(
      Response.json({
        url: "/object/upload/sign/media/images/u1/a.png?token=abc",
        token: "abc",
      }),
    );

    const signed = await driver.signedUploadUrl("images/u1/a.png");

    expect(signed.url).toBe(
      "https://project.supabase.co/storage/v1/object/upload/sign/media/images/u1/a.png?token=abc",
    );
  });

  it("complains rather than returning a URL nobody can upload to", async () => {
    captureFetch(new Response("denied", { status: 403 }));

    await expect(driver.signedUploadUrl("images/u1/a.png")).rejects.toThrow(
      /403/,
    );
  });
});
