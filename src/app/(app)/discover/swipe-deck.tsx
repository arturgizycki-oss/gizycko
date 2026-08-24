"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { PhotoPlaceholder } from "@/components/avatar";
import { swipe } from "./actions";

export type Candidate = {
  userId: string;
  displayName: string;
  age: number;
  city: string | null;
  bio: string | null;
  photos: string[];
};

export function SwipeDeck({ initialDeck }: { initialDeck: Candidate[] }) {
  const [deck, setDeck] = useState(initialDeck);
  const [matchedWith, setMatchedWith] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = deck[0];

  function decide(direction: "LIKE" | "PASS") {
    if (!current) return;
    const candidate = current;

    startTransition(async () => {
      const result = await swipe(candidate.userId, direction);
      setDeck((rest) => rest.slice(1));
      if (result.matched) setMatchedWith(candidate.displayName);
    });
  }

  if (!current) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
        No one new right now. Check back later, or widen your age and distance
        preferences in your profile.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      {matchedWith && (
        <div
          role="status"
          className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white"
        >
          It is a match with {matchedWith}! Say hello from Matches.
        </div>
      )}

      <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative h-[min(46dvh,22rem)] w-full bg-neutral-200 dark:bg-neutral-800">
          {current.photos[0] ? (
            <Image
              src={current.photos[0]}
              alt={current.displayName}
              fill
              sizes="(max-width: 640px) 100vw, 384px"
              className="object-cover"
              priority
            />
          ) : (
            <PhotoPlaceholder name={current.displayName} className="h-full w-full" />
          )}
        </div>

        <div className="p-3">
          <a
            href={`/u/${current.userId}`}
            className="text-base font-semibold hover:underline"
          >
            {current.displayName}, {current.age}
          </a>
          {current.city && (
            <p className="text-xs text-neutral-500">{current.city}</p>
          )}
          {current.bio && (
            <p className="mt-2 line-clamp-3 text-sm whitespace-pre-wrap">
              {current.bio}
            </p>
          )}
        </div>
      </article>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => decide("PASS")}
          disabled={pending}
          className="flex-1 rounded-full border border-neutral-300 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => decide("LIKE")}
          disabled={pending}
          className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          Like
        </button>
      </div>
    </div>
  );
}
