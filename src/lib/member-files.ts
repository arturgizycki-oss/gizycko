import { prisma } from "./prisma";
import { deleteObject, keyFromMediaUrl } from "./storage";

/**
 * Remove everything one member has uploaded.
 *
 * Deleting the database rows is not enough. Photos, voice notes, songs and
 * videos live in the bucket, and nothing in a cascade reaches them - so an
 * erased account would leave its owner's face sitting in storage indefinitely.
 * Under the GDPR that is not erasure, it is a filing error.
 *
 * Call this before deleting the member, while the rows that name the files
 * still exist.
 */
export async function deleteMemberFiles(userId: string): Promise<number> {
  const [photos, images, posts, messages] = await Promise.all([
    prisma.photo.findMany({
      where: { profile: { userId } },
      select: { url: true },
    }),
    prisma.postImage.findMany({
      where: { post: { authorId: userId } },
      select: { url: true },
    }),
    prisma.post.findMany({
      where: { authorId: userId },
      select: { audioUrl: true, videoUrl: true },
    }),
    prisma.message.findMany({
      where: { senderId: userId, mediaUrl: { not: null } },
      select: { mediaUrl: true },
    }),
  ]);

  const urls = [
    ...photos.map((row) => row.url),
    ...images.map((row) => row.url),
    ...posts.flatMap((row) => [row.audioUrl, row.videoUrl]),
    ...messages.map((row) => row.mediaUrl),
  ];

  // A key can appear twice if the same upload was attached in two places.
  const keys = new Set(
    urls
      .filter((url): url is string => Boolean(url))
      .map(keyFromMediaUrl)
      .filter((key): key is string => Boolean(key)),
  );

  // One failure must not strand the rest. Deleting is idempotent, so anything
  // that fails here can be swept up later without harm.
  await Promise.allSettled([...keys].map((key) => deleteObject(key)));

  return keys.size;
}
