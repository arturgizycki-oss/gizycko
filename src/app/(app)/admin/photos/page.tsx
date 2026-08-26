import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/session";
import { shortWhen } from "@/lib/time";
import { reviewPhoto } from "../../moderation/actions";

export default async function AdminPhotosPage() {
  await requireModerator();

  const photos = await prisma.photo.findMany({
    where: { moderation: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 36,
    select: {
      id: true,
      url: true,
      createdAt: true,
      profile: { select: { displayName: true, userId: true } },
    },
  });

  return (
    <section className="gh-box">
      <div className="gh-box-header">
        {photos.length} {photos.length === 1 ? "photo" : "photos"} waiting
      </div>

      {photos.length === 0 ? (
        <p className="gh-row gh-muted">
          Nothing to review. New photos are visible straight away and appear
          here for a second look; rejecting one hides it from everybody else.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="gh-box">
              <div
                className="relative aspect-square"
                style={{ background: "var(--gh-subtle)" }}
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>

              <div className="p-2">
                <Link
                  href={`/u/${photo.profile.userId}`}
                  className="gh-link block truncate text-xs font-semibold"
                >
                  {photo.profile.displayName}
                </Link>
                <p className="gh-muted">{shortWhen(photo.createdAt)}</p>

                {/*
                    Stacked, not side by side. A .gh-btn will not wrap and will
                    not shrink below its own text, so two of them across a card
                    this narrow put Reject through the right-hand edge. Full
                    width also gives each a bigger target for a decision that
                    hides somebody's photograph.
                */}
                <div className="mt-2 flex flex-col gap-1">
                  <form action={reviewPhoto.bind(null, photo.id, true)}>
                    <button
                      type="submit"
                      className="gh-btn w-full justify-center"
                    >
                      Keep
                    </button>
                  </form>
                  <form action={reviewPhoto.bind(null, photo.id, false)}>
                    <button
                      type="submit"
                      className="gh-btn gh-btn-danger w-full justify-center"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
