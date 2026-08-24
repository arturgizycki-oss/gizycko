import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { ageFrom } from "@/lib/age";
import { PhotoManager } from "./photo-manager";
import { ProfileForm } from "./profile-form";

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
        {session.user.role !== "USER" && (
          <Link
            href="/moderation"
            className="mt-2 inline-block text-sm font-medium text-rose-600 hover:underline"
          >
            Open the moderation queue →
          </Link>
        )}
      </header>

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
        <a href="/settings" className="underline">
          Settings
        </a>
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
