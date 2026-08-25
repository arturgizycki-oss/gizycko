/**
 * Limits the composer and the server action both need.
 *
 * Kept apart from post-media.ts, which reaches for node:fs through the storage
 * layer. A client component importing that would drag Node-only code into the
 * browser bundle and fail the build.
 */
export const MAX_POST_IMAGES = 4;
