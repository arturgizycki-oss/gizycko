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

describe("object storage", () => {
  it("round-trips a file", async () => {
    await storage.putObject("photos/u1/a.png", Buffer.from("hello"));
    const found = await storage.getObject("photos/u1/a.png");

    expect(found?.data.toString()).toBe("hello");
    expect(found?.contentType).toBe("image/png");
  });

  it("returns null for something that is not there", async () => {
    expect(await storage.getObject("photos/nope.png")).toBeNull();
  });

  it("deletes, and deleting twice is not an error", async () => {
    await storage.putObject("photos/u1/b.jpg", Buffer.from("x"));
    await storage.deleteObject("photos/u1/b.jpg");
    await storage.deleteObject("photos/u1/b.jpg");

    expect(await storage.getObject("photos/u1/b.jpg")).toBeNull();
  });

  it("refuses to escape the storage root", async () => {
    await expect(
      storage.putObject("../../escaped.txt", Buffer.from("nope")),
    ).rejects.toThrow(/outside storage/);

    await expect(
      storage.getObject("photos/../../../etc/passwd"),
    ).resolves.toBeNull();
  });

  it("maps urls to keys and back", () => {
    const key = "photos/u1/a.png";
    expect(storage.mediaUrl(key)).toBe("/api/media/photos/u1/a.png");
    expect(storage.keyFromMediaUrl(storage.mediaUrl(key))).toBe(key);
    expect(storage.keyFromMediaUrl("https://evil.example/x.png")).toBeNull();
  });
});
