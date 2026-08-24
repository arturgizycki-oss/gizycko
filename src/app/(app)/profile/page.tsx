import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { ageFrom } from "@/lib/age";
import { followCounts, followersOf, followingOf } from "@/lib/follows";
import { Avatar } from "@/components/avatar";
import { CollapsibleSection } from "@/components/collapsible-section";
import { PhotoManager } from "./photo-manager";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const { session, profile } = await requireProfile();
  const me = session.user.id;

  const [counts, followers, following, postCount] = await Promise.all([
    followCounts(me),
    followersOf(me, me),
    followingOf(me, me),
    prisma.post.count({ where: { authorId: me, deletedAt: null, groupId: null } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">
          {profile.displayName}, {ageFrom(profile.birthDate)}
        </h1>
        <p className="muted text-sm">
          {profile.city ?? "No city set"} · {session.user.email}
        </p>
        {session.user.role !== "USER" && (
          <Link
            href="/moderation"
            className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            Open the moderation queue →
          </Link>
        )}
      </header>

      <dl className="card grid grid-cols-4 divide-x divide-[var(--line)] text-center">
        {[
          { label: "Followers", value: counts.followers },
          { label: "Following", value: counts.following },
          { label: "Posts", value: postCount },
          { label: "Photos", value: profile.photos.length },
        ].map((stat) => (
          <div key={stat.label} className="py-3">
            <dd className="text-lg font-semibold">{stat.value}</dd>
            <dt className="hint">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <CollapsibleSection title="Followers" count={counts.followers}>
        <PeopleList
          people={followers}
          empty="Nobody follows you yet. Posting publicly is the fastest way to change that."
        />
      </CollapsibleSection>

      <CollapsibleSection title="Following" count={counts.following}>
        <PeopleList
          people={following}
          empty="You are not following anyone yet."
        />
      </CollapsibleSection>

      <PhotoManager
        photos={profile.photos.map((photo) => ({
          id: photo.id,
          url: photo.url,
          isPrimary: photo.isPrimary,
          moderation: photo.moderation,
        }))}
      />

      <p className="hint">
        Your data, blocked people, and account deletion are in{" "}
        <Link href="/settings" className="underline">
          Settings
        </Link>
        .
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
