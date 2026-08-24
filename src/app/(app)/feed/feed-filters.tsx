"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export const SORTS = [
  { value: "new", label: "Newest" },
  { value: "top", label: "Most liked" },
  { value: "discussed", label: "Most discussed" },
] as const;

export const SOURCES = [
  { value: "all", label: "Everyone" },
  { value: "friends", label: "Friends" },
  { value: "matches", label: "Matches" },
  { value: "mine", label: "Just me" },
] as const;

export const KINDS = [
  { value: "all", label: "Anything" },
  { value: "photos", label: "Photos" },
  { value: "video", label: "Video" },
  { value: "song", label: "Songs" },
] as const;

const selectClass =
  "rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-rose-500 dark:border-neutral-700 dark:bg-neutral-900";

export function FeedFilters({
  sort,
  source,
  kind,
  total,
}: {
  sort: string;
  source: string;
  kind: string;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "new" || value === "all") next.delete(key);
    else next.set(key, value);

    const query = next.toString();
    startTransition(() => router.push(query ? `/feed?${query}` : "/feed"));
  }

  const filtered = source !== "all" || kind !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 p-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
      <label className="flex items-center gap-1.5 text-xs text-neutral-500">
        Sort
        <select
          value={sort}
          onChange={(event) => set("sort", event.target.value)}
          className={selectClass}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-xs text-neutral-500">
        From
        <select
          value={source}
          onChange={(event) => set("from", event.target.value)}
          className={selectClass}
        >
          {SOURCES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-xs text-neutral-500">
        With
        <select
          value={kind}
          onChange={(event) => set("has", event.target.value)}
          className={selectClass}
        >
          {KINDS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <span className="ml-auto text-xs text-neutral-500">
        {pending ? "Loading…" : `${total} ${total === 1 ? "post" : "posts"}`}
      </span>

      {filtered && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push("/feed"))}
          className="text-xs text-neutral-500 underline hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Clear
        </button>
      )}
    </div>
  );
}
