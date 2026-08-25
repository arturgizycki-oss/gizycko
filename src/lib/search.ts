import { prisma } from "./prisma";
import { hiddenUserIds } from "./social";

/** Below this a query matches most of the site and is not worth running. */
export const MIN_QUERY = 2;

/** Read a `q` search param, trimmed, or null when there is nothing to search. */
export function readQuery(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim() ?? "";
  return trimmed.length >= MIN_QUERY ? trimmed : null;
}

const PRIMARY_PHOTO = {
  where: { isPrimary: true, moderation: { not: "REJECTED" as const } },
  select: { url: true },
  take: 1,
};

export type FoundPerson = {
  id: string;
  name: string;
  photo: string | null;
  city: string | null;
};

/**
 * People whose display name contains the query.
 *
 * Only completed, visible profiles of accounts in good standing, and never
 * anyone either side has blocked. `mode: "insensitive"` keeps it case-blind;
 * Postgres answers it with a sequential scan, which is fine at this size. A
 * trigram index on display_name is the next step if the member list grows.
 */
export async function searchPeople(
  viewerId: string,
  query: string,
  take = 20,
): Promise<FoundPerson[]> {
  const hidden = await hiddenUserIds(viewerId);

  const profiles = await prisma.profile.findMany({
    where: {
      completedAt: { not: null },
      isVisible: true,
      displayName: { contains: query, mode: "insensitive" },
      userId: { notIn: [viewerId, ...hidden] },
      user: { bannedAt: null },
    },
    orderBy: { lastActiveAt: "desc" },
    take,
    select: {
      userId: true,
      displayName: true,
      city: true,
      photos: PRIMARY_PHOTO,
    },
  });

  return profiles.map((profile) => ({
    id: profile.userId,
    name: profile.displayName,
    photo: profile.photos[0]?.url ?? null,
    city: profile.city,
  }));
}

export type FoundGroup = {
  id: string;
  name: string;
  description: string | null;
  members: number;
  joined: boolean;
};

/**
 * Groups matching the query by name or description.
 *
 * Private groups are included only where the viewer is already a member --
 * otherwise search would expose the existence of every private group by name.
 */
export async function searchGroups(
  viewerId: string,
  query: string,
  take = 20,
): Promise<FoundGroup[]> {
  const groups = await prisma.group.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        {
          OR: [
            { visibility: "PUBLIC" },
            { members: { some: { userId: viewerId } } },
          ],
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { members: true } },
      members: { where: { userId: viewerId }, select: { id: true }, take: 1 },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    members: group._count.members,
    joined: group.members.length > 0,
  }));
}
