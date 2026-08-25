"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/avatar";
import { swipe } from "./actions";
import { useT } from "@/lib/i18n/provider";
import { useToast } from "@/components/toast";
import { HeartIcon } from "@/components/icons";
import type { Candidate } from "./swipe-deck";

/**
 * Everyone worth meeting, as a grid.
 *
 * The one-card-at-a-time deck showed a single person and hid the rest behind a
 * decision, which is a lot of ceremony when there are four people on the site.
 * A grid lets somebody scan, and fills left to right so the first face is
 * where the eye already is.
 *
 * The whole tile is a link to the profile. Like and Pass sit on top of it and
 * stop the click from travelling, so the common action is one tap and the
 * quick ones are still there.
 */
export function PeopleGrid({ initialDeck }: { initialDeck: Candidate[] }) {
  const t = useT();
  const toast = useToast();
  const [deck, setDeck] = useState(initialDeck);
  const [pending, startTransition] = useTransition();

  function decide(candidate: Candidate, direction: "LIKE" | "PASS") {
    startTransition(async () => {
      const result = await swipe(candidate.userId, direction);
      setDeck((rest) =>
        rest.filter((person) => person.userId !== candidate.userId),
      );

      if (result.matched) {
        toast(`${t("matches.sayHello")} ${candidate.displayName}`, "info");
      }
    });
  }

  if (deck.length === 0) {
    return <p className="empty-state">{t("discover.empty")}</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {deck.map((person) => (
        <li key={person.userId}>
          <article className="group card relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
            <Link
              href={`/u/${person.userId}`}
              className="block"
              aria-label={person.displayName}
            >
              <div className="relative aspect-[3/4] bg-[var(--surface-muted)]">
                {person.photos[0] ? (
                  <Image
                    src={person.photos[0]}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <PhotoPlaceholder
                    name={person.displayName}
                    className="h-full w-full"
                  />
                )}

                {/* Keeps the name legible whatever the photograph is doing. */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 pt-8">
                  <p className="truncate text-sm font-semibold text-white">
                    {person.displayName}, {person.age}
                  </p>
                  {person.city && (
                    <p className="truncate text-xs text-white/80">
                      {person.city}
                    </p>
                  )}
                </div>
              </div>
            </Link>

            <div className="flex gap-1 p-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => decide(person, "PASS")}
                className="btn btn-secondary btn-sm flex-1 justify-center"
              >
                {t("discover.pass")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => decide(person, "LIKE")}
                aria-label={t("discover.like")}
                className="btn btn-primary btn-sm flex-1 justify-center"
              >
                <HeartIcon className="size-4" />
              </button>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
