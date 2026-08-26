import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfileWithPhotos } from "@/lib/session";
import { ageFrom } from "@/lib/age";
import { followCounts, followersOf, followingOf } from "@/lib/follows";
import { Avatar } from "@/components/avatar";
import { CollapsibleSection } from "@/components/collapsible-section";
import { PhotoManager } from "./photo-manager";
import { ProfileForm } from "./profile-form";
import { getTranslator } from "@/lib/i18n";
import { ArrowRightIcon } from "@/components/icons";

export default async function ProfilePage() {
  const { session, profile, photos } = await requireProfileWithPhotos();
  const me = session.user.id;
  const t = await getTranslator();

  const [counts, followers, following, postCount] = await Promise.all([
    followCounts(me),
    followersOf(me, me),
    followingOf(me, me),
    prisma.post.count({
      where: { authorId: me, deletedAt: null, groupId: null },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">
          {profile.displayName}, {ageFrom(profile.birthDate)}
        </h1>
        <p className="muted text-sm">
          {profile.city ?? t("profile.noCity")} · {session.user.email}
        </p>

        {session.user.role !== "USER" && (
          <Link
            href="/admin"
            className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            {t("profile.moderationQueue")}
            <ArrowRightIcon className="size-4" />
          </Link>
        )}
      </header>

      <dl className="card grid grid-cols-2 divide-[var(--line)] text-center sm:grid-cols-4 sm:divide-x">
        {[
          { label: t("profile.followers"), value: counts.followers },
          { label: t("profile.followingCount"), value: counts.following },
          { label: t("profile.posts"), value: postCount },
          { label: t("profile.photos"), value: photos.length },
        ].map((stat) => (
          <div key={stat.label} className="py-3">
            <dd className="text-lg font-semibold">{stat.value}</dd>
            <dt className="hint">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <CollapsibleSection
        title={t("profile.followers")}
        count={counts.followers}
      >
        <PeopleList people={followers} empty={t("profile.followersEmpty")} />
      </CollapsibleSection>

      <CollapsibleSection
        title={t("profile.followingCount")}
        count={counts.following}
      >
        <PeopleList people={following} empty={t("profile.followingEmpty")} />
      </CollapsibleSection>

      <PhotoManager photos={photos} />

      <p className="hint">
        <Link href="/settings" className="underline">
          {t("profile.settingsNote")}
        </Link>
      </p>

      <ProfileForm
        profile={{
          displayName: profile.displayName,
          bio: profile.bio,
          occupation: profile.occupation,
          city: profile.city,
          interestedIn: profile.interestedIn,
          minAgePref: profile.minAgePref,
          maxAgePref: profile.maxAgePref,
          maxDistanceKm: profile.maxDistanceKm,
          isVisible: profile.isVisible,
        }}
      />
    </div>
  );
}

function PeopleList({
  people,
  empty,
}: {
  people: { id: string; name: string; photo: string | null }[];
  empty: string;
}) {
  if (people.length === 0) {
    return <p className="muted px-2 py-3 text-sm">{empty}</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {people.map((person) => (
        <li key={person.id}>
          <Link
            href={`/u/${person.id}`}
            className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-[var(--surface-muted)]"
          >
            <Avatar name={person.name} src={person.photo} size={36} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {person.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
