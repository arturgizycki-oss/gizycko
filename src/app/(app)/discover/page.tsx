import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { hiddenUserIds } from "@/lib/social";
import { ageFrom } from "@/lib/age";
import { PeopleGrid } from "./people-grid";
import { getTranslator } from "@/lib/i18n";

/** Birth-date bounds for an age range, oldest first. */
function birthDateRange(minAge: number, maxAge: number, now = new Date()) {
  const newest = new Date(now);
  newest.setFullYear(newest.getFullYear() - minAge);
  const oldest = new Date(now);
  oldest.setFullYear(oldest.getFullYear() - maxAge - 1);
  return { gte: oldest, lte: newest };
}

export default async function DiscoverPage() {
  const { session, profile } = await requireProfile();
  const me = session.user.id;
  const t = await getTranslator();

  const [hidden, swiped] = await Promise.all([
    hiddenUserIds(me),
    prisma.swipe.findMany({
      where: { fromUserId: me },
      select: { toUserId: true },
    }),
  ]);

  const excluded = [me, ...hidden, ...swiped.map((s) => s.toUserId)];

  const candidates = await prisma.profile.findMany({
    where: {
      isVisible: true,
      completedAt: { not: null },
      userId: { notIn: excluded },
      user: { bannedAt: null },
      // They are a gender I want to meet...
      gender: { in: profile.interestedIn },
      // ...and they want to meet mine.
      interestedIn: { has: profile.gender },
      birthDate: birthDateRange(profile.minAgePref, profile.maxAgePref),
    },
    orderBy: { lastActiveAt: "desc" },
    take: 20,
    include: { photos: { orderBy: { position: "asc" }, take: 6 } },
  });

  const deck = candidates.map((candidate) => ({
    userId: candidate.userId,
    displayName: candidate.displayName,
    age: ageFrom(candidate.birthDate),
    city: candidate.city,
    bio: candidate.bio,
    photos: candidate.photos
      .filter((photo) => photo.moderation !== "REJECTED")
      .map((photo) => photo.url),
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">
        {t("discover.title")}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">{t("discover.intro")}</p>
      <PeopleGrid initialDeck={deck} />
    </div>
  );
}
