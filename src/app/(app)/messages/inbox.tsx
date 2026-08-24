"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import {
  markAllConversationsRead,
  markConversationRead,
  markConversationUnread,
} from "./actions";

export type InboxItem = {
  matchId: string;
  otherUserId: string;
  name: string;
  photo: string | null;
  preview: string;
  when: string;
  unread: number;
  closed: boolean;
};

type Filter = "all" | "unread";

export function Inbox({ items }: { items: InboxItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const totalUnread = items.reduce((sum, item) => sum + item.unread, 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "unread" && item.unread === 0) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.preview.toLowerCase().includes(needle)
      );
    });
  }, [items, filter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-neutral-300 p-0.5 dark:border-neutral-700">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                filter === value
                  ? "rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "rounded-full px-3 py-1 text-xs font-medium text-neutral-500"
              }
            >
              {value === "all" ? "All" : `Unread${totalUnread ? ` (${totalUnread})` : ""}`}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search names and messages"
          className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm outline-none focus:border-rose-500 dark:border-neutral-700 dark:bg-neutral-900"
        />

        {totalUnread > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => markAllConversationsRead())}
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60 dark:border-neutral-700"
          >
            Mark all read
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          {items.length === 0
            ? "No conversations yet. Match with someone in Discover and you can message them here."
            : "Nothing matches that."}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {visible.map((item) => (
            <li
              key={item.matchId}
              className={
                item.unread > 0
                  ? "flex items-center gap-3 bg-rose-50/50 px-4 py-3 dark:bg-rose-950/15"
                  : "flex items-center gap-3 px-4 py-3"
              }
            >
              <Link href={`/u/${item.otherUserId}`} aria-label={`${item.name}'s profile`}>
                <Avatar name={item.name} src={item.photo} size={44} />
              </Link>

              <Link href={`/matches/${item.matchId}`} className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  {item.closed && (
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800">
                      ended
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-neutral-500">
                    {item.when}
                  </span>
                </div>
                <p
                  className={
                    item.unread > 0
                      ? "truncate text-sm font-medium"
                      : "truncate text-sm text-neutral-500"
                  }
                >
                  {item.preview}
                </p>
              </Link>

              <div className="flex shrink-0 flex-col items-end gap-1">
                {item.unread > 0 ? (
                  <>
                    <span className="flex size-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                      {item.unread > 9 ? "9+" : item.unread}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(() => markConversationRead(item.matchId))
                      }
                      className="text-[11px] text-neutral-500 hover:underline disabled:opacity-60"
                    >
                      Mark read
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => markConversationUnread(item.matchId))
                    }
                    className="text-[11px] text-neutral-500 hover:underline disabled:opacity-60"
                  >
                    Mark unread
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
