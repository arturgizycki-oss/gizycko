/**
 * Limits shared by the composer and the server action. They cannot live in the
 * action module: a "use server" file may only export async functions.
 */
export const MAX_POST_IMAGES = 4;
