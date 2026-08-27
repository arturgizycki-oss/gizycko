"use client";

/**
 * Make a photograph out of whatever somebody actually picked.
 *
 * Two things were turning ordinary people away at the profile photo, and both
 * hit phones hardest - which is where the photograph almost always comes from.
 *
 * An iPhone saves as HEIC unless it has been told otherwise, and the server
 * accepts JPEG, PNG, WebP and GIF. So a member picked the photo they meant to
 * use and was told their image was not an image.
 *
 * And a modern phone camera writes files well past the five megabyte limit -
 * a portrait shot from a recent handset is routinely eight or ten.
 *
 * Redrawing the picture through a canvas answers both. The browser decodes
 * whatever it can display, including HEIC on the Apple devices that produce
 * it, and what comes back out is a JPEG at a sensible size. Nothing is asked
 * of the member, and the file that reaches the server is smaller as well.
 */

/** Longest edge, in pixels. Beyond this nothing on the site shows the detail. */
const MAX_EDGE = 1600;

/** Aim comfortably under the server's limit rather than at it. */
const TARGET_BYTES = 3 * 1024 * 1024;

const QUALITIES = [0.85, 0.72, 0.6, 0.5];

export type Prepared = { ok: true; file: File } | { ok: false; error: string };

function isImage(file: File): boolean {
  // A HEIC picked on some Androids arrives with an empty type, so the
  // extension has to be trusted when the browser will not say.
  return (
    file.type.startsWith("image/") ||
    /\.(hei[cf]|jpe?g|png|webp|gif)$/i.test(file.name)
  );
}

/** Whether this is already something the server takes, and small enough. */
function alreadyFine(file: File): boolean {
  const known = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  return known.includes(file.type) && file.size <= TARGET_BYTES;
}

async function draw(file: File): Promise<HTMLCanvasElement> {
  /*
   * `imageOrientation: "from-image"` matters more than it looks.
   *
   * A phone writes the picture in the sensor's orientation and records how to
   * turn it in the EXIF. A canvas ignores that unless asked, so without this a
   * portrait selfie is uploaded on its side - and the member has no way to
   * correct it afterwards.
   */
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2d context");

  // White underneath, because a transparent PNG flattened onto nothing turns
  // black as a JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas;
}

function toBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality),
  );
}

/**
 * Hand back something the server will accept, or say why not.
 *
 * Anything that is not an image is passed straight through - a song and a
 * video go down this same road and must not be touched.
 */
export async function prepareImage(file: File): Promise<Prepared> {
  if (!isImage(file)) return { ok: true, file };
  if (alreadyFine(file)) return { ok: true, file };

  try {
    const canvas = await draw(file);

    for (const quality of QUALITIES) {
      const blob = await toBlob(canvas, quality);
      if (!blob) break;

      if (
        blob.size <= TARGET_BYTES ||
        quality === QUALITIES[QUALITIES.length - 1]
      ) {
        const name = file.name.replace(/\.[^.]+$/, "") || "photo";
        return {
          ok: true,
          file: new File([blob], `${name}.jpg`, { type: "image/jpeg" }),
        };
      }
    }

    return {
      ok: false,
      error: "That image could not be prepared. Try another.",
    };
  } catch {
    /*
     * The browser could not decode it. In practice this is a HEIC opened
     * somewhere other than an Apple device, where nothing can read it - so the
     * message says what to do rather than naming a format nobody chose.
     */
    return {
      ok: false,
      error:
        "That photo is in a format this browser cannot read. Open it in your photos app and save or share it as a JPEG, then try again.",
    };
  }
}
