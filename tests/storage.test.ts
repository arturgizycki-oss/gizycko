import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

let storage: typeof import("@/lib/storage");
let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "gizycko-storage-"));
  process.env.STORAGE_DIR = root;
  // Imported after STORAGE_DIR is set, because the module resolves it once.
  storage = await import("@/lib/storage");
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

/** Drain a web stream into a string, the way a fetch response would. */
async function read(
  stream: Promise<ReadableStream<Uint8Array>>,
): Promise<string> {
  return new Response(await stream).text();
}

describe("object storage", () => {
  it("round-trips a file", async () => {
    await storage.putObject("photos/u1/a.png", Buffer.from("hello"));
    const found = await storage.statObject("photos/u1/a.png");

    expect(found?.size).toBe(5);
    expect(found?.contentType).toBe("image/png");
    expect(await read(storage.streamObject("photos/u1/a.png"))).toBe("hello");
  });

  it("streams a byte range, so players can seek", async () => {
    await storage.putObject("clips/u1/c.mp3", Buffer.from("0123456789"));

    const middle = storage.streamObject("clips/u1/c.mp3", { start: 3, end: 6 });
    expect(await read(middle)).toBe("3456");
  });

  it("returns null for something that is not there", async () => {
    expect(await storage.statObject("photos/nope.png")).toBeNull();
  });

  it("returns null for a directory", async () => {
    await storage.putObject("photos/u2/a.png", Buffer.from("x"));
    expect(await storage.statObject("photos/u2")).toBeNull();
  });

  it("deletes, and deleting twice is not an error", async () => {
    await storage.putObject("photos/u1/b.jpg", Buffer.from("x"));
    await storage.deleteObject("photos/u1/b.jpg");
    await storage.deleteObject("photos/u1/b.jpg");

    expect(await storage.statObject("photos/u1/b.jpg")).toBeNull();
  });

  it("refuses to escape the storage root", async () => {
    await expect(
      storage.putObject("../../escaped.txt", Buffer.from("nope")),
    ).rejects.toThrow(/outside storage/);

    await expect(
      storage.statObject("photos/../../../etc/passwd"),
    ).resolves.toBeNull();

    await expect(
      storage.streamObject("photos/../../../etc/passwd"),
    ).rejects.toThrow(/outside storage/);
  });

  it("maps urls to keys and back", () => {
    const key = "photos/u1/a.png";
    expect(storage.mediaUrl(key)).toBe("/api/media/photos/u1/a.png");
    expect(storage.keyFromMediaUrl(storage.mediaUrl(key))).toBe(key);
    expect(storage.keyFromMediaUrl("https://evil.example/x.png")).toBeNull();
  });
});
