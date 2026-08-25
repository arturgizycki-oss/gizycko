"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";

/** Option values are what the URL carries; the label is a key, not text. */
export const SORTS = [
  { value: "new", label: "feed.sortNew" },
  { value: "top", label: "feed.sortTop" },
  { value: "discussed", label: "feed.sortDiscussed" },
] as const satisfies readonly { value: string; label: MessageKey }[];

export const SOURCES = [
  { value: "all", label: "feed.fromAll" },
  { value: "friends", label: "feed.fromFriends" },
  { value: "matches", label: "feed.fromMatches" },
  { value: "mine", label: "feed.fromMine" },
] as const satisfies readonly { value: string; label: MessageKey }[];

export const KINDS = [
  { value: "all", label: "feed.hasAll" },
  { value: "photos", label: "feed.hasPhotos" },
  { value: "video", label: "feed.hasVideo" },
  { value: "song", label: "feed.hasSong" },
] as const satisfies readonly { value: string; label: MessageKey }[];

const selectClass =
  "rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900";

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
  const t = useT();
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
    <div className="card-glass flex flex-wrap items-center gap-2 p-3">
      <label className="flex items-center gap-1.5 text-xs text-neutral-500">
        {t("feed.sortLabel")}
        <select
          value={sort}
          onChange={(event) => set("sort", event.target.value)}
          className={selectClass}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-xs text-neutral-500">
        {t("feed.fromLabel")}
        <select
          value={source}
          onChange={(event) => set("from", event.target.value)}
          className={selectClass}
        >
          {SOURCES.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-xs text-neutral-500">
        {t("feed.withLabel")}
        <select
          value={kind}
          onChange={(event) => set("has", event.target.value)}
          className={selectClass}
        >
          {KINDS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
      </label>

      <span className="ml-auto text-xs text-neutral-500">
        {pending
          ? t("action.loading")
          : `${total} ${total === 1 ? t("feed.postsOne") : t("feed.postsMany")}`}
      </span>

      {filtered && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push("/feed"))}
          className="text-xs text-neutral-500 underline hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          {t("action.clear")}
        </button>
      )}
    </div>
  );
}
