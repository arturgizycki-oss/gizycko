import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareImage } from "@/lib/image-client";

/**
 * The browser side of picking a photograph, which runs in a browser and not
 * here - so canvas and createImageBitmap are stood in for. What is being
 * checked is the decision made around them: what gets converted, what is left
 * alone, and what a member is told when the picture cannot be read at all.
 *
 * This exists because the alternative was finding out from a member. One did:
 * they picked a photo, were told it was not an image, and gave up on the site.
 */
const MB = 1024 * 1024;

function fakeFile(name: string, type: string, size: number): File {
  const file = new File([new Uint8Array(8)], name, { type });
  // A real File of eight megabytes would be eight megabytes of test fixture.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

/** A canvas that yields a blob of whatever size the test asks for. */
function stubCanvas(blobSize: number) {
  vi.stubGlobal("createImageBitmap", async () => ({
    width: 4032,
    height: 3024,
    close: () => {},
  }));

  vi.stubGlobal("document", {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({
        fillStyle: "",
        fillRect: () => {},
        drawImage: () => {},
      }),
      toBlob: (done: (blob: Blob) => void) =>
        done({ size: blobSize } as unknown as Blob),
    }),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("preparing a picked photograph", () => {
  it("converts a HEIC from a phone into a JPEG", async () => {
    stubCanvas(900 * 1024);

    const result = await prepareImage(
      fakeFile("IMG_0421.HEIC", "image/heic", 4 * MB),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.type).toBe("image/jpeg");
    expect(result.file.name).toBe("IMG_0421.jpg");
  });

  /*
   * The other half of what turned people away: a photo in an accepted format,
   * refused only for being the size a modern camera writes.
   */
  it("shrinks an oversized JPEG rather than refusing it", async () => {
    stubCanvas(1.2 * MB);

    const result = await prepareImage(
      fakeFile("photo.jpg", "image/jpeg", 9 * MB),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.size).toBeLessThan(3 * MB);
  });

  it("leaves a picture that is already fine alone", async () => {
    const original = fakeFile("small.png", "image/png", 400 * 1024);

    const result = await prepareImage(original);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Same object: no redraw, so no generation loss and no wasted work.
    expect(result.file).toBe(original);
  });

  it("does not touch a song or a video", async () => {
    const song = fakeFile("track.mp3", "audio/mpeg", 8 * MB);

    const result = await prepareImage(song);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file).toBe(song);
  });

  /*
   * A HEIC opened anywhere other than an Apple device cannot be decoded at
   * all. The member still has to be told something they can act on.
   */
  it("explains what to do when the browser cannot read it", async () => {
    vi.stubGlobal("createImageBitmap", async () => {
      throw new Error("cannot decode");
    });

    const result = await prepareImage(
      fakeFile("IMG_9.HEIC", "image/heic", 4 * MB),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("JPEG");
  });
});
