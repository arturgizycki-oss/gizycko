/**
 * What the file picker offers for a photograph.
 *
 * Wider than what the server stores, on purpose. An iPhone saves as HEIC
 * unless told otherwise, and listing only the four stored formats greys the
 * member's own photographs out in the picker - so the first thing the site
 * does is refuse the picture they came to upload.
 *
 * They are converted to JPEG in the browser before anything is sent. See
 * prepareImage.
 */
export const PICKER_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  // Some Androids report no type at all for a HEIC, so the extensions are
  // listed as well - a picker will take either.
  ".heic",
  ".heif",
];

/** The same as one attribute value. */
export const PICKER_IMAGE_ACCEPT = PICKER_IMAGE_TYPES.join(",");
