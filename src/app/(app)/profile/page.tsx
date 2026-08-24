import { requireProfile } from "@/lib/session";
import { ageFrom } from "@/lib/age";

const GENDER_LABELS: Record<string, string> = {
  MAN: "Man",
  WOMAN: "Woman",
  NONBINARY: "Non-binary",
  OTHER: "Other",
};

export default async function ProfilePage() {
  const { session, profile } = await requireProfile();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">
          {profile.displayName}, {ageFrom(profile.birthDate)}
        </h1>
        <p className="text-sm text-neutral-500">
          {profile.city ?? "No city set"} · {session.user.email}
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-medium">About</h2>
        <p className="mt-2 whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
          {profile.bio ?? "You have not written a bio yet."}
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-medium">Preferences</h2>
        <dl className="mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
          <div className="flex gap-2">
            <dt>I am</dt>
            <dd className="font-medium">{GENDER_LABELS[profile.gender]}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Looking for</dt>
            <dd className="font-medium">
              {profile.interestedIn.map((g) => GENDER_LABELS[g]).join(", ")}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt>Age range</dt>
            <dd className="font-medium">
              {profile.minAgePref}–{profile.maxAgePref}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt>Distance</dt>
            <dd className="font-medium">{profile.maxDistanceKm} km</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-medium">Photos</h2>
        <p className="mt-2 text-neutral-500">
          {profile.photos.length === 0
            ? "No photos yet — uploads land in the next step of the build."
            : `${profile.photos.length} uploaded.`}
        </p>
      </section>
    </div>
  );
}
