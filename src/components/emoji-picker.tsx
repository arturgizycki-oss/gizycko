"use client";

import { useEffect, useRef, useState } from "react";
import { ALL_EMOJI, EMOJI_GROUPS } from "@/lib/emoji";

/**
 * Emoji keyboard. Rendered inline above the composer rather than in a portal,
 * so it scrolls and closes with the form it belongs to.
 */
export function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const [group, setGroup] = useState(0);
  const [query, setQuery] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function onClickAway(event: MouseEvent) {
      if (!panel.current?.contains(event.target as Node)) onClose();
    }

    document.addEventListener("keydown", onKey);
    // Deferred, or the click that opened the picker closes it again.
    const id = setTimeout(() => document.addEventListener("mousedown", onClickAway), 0);

    return () => {
      clearTimeout(id);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAway);
    };
  }, [onClose]);

  const searching = query.trim().length > 0;
  const shown = searching
    ? ALL_EMOJI.filter((emoji) => emoji.includes(query.trim()))
    : EMOJI_GROUPS[group].emoji;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Choose an emoji"
      className="card absolute bottom-full left-0 z-30 mb-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden"
    >
      <div className="flex gap-1 border-b border-[var(--line)] p-1.5">
        {EMOJI_GROUPS.map((item, at) => (
          <button
            key={item.name}
            type="button"
            title={item.name}
            aria-label={item.name}
            aria-pressed={!searching && at === group}
            onClick={() => {
              setQuery("");
              setGroup(at);
            }}
            className={
              !searching && at === group
                ? "rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-base"
                : "rounded-lg px-2 py-1 text-base opacity-60 hover:opacity-100"
            }
          >
            {item.icon}
          </button>
        ))}
      </div>

      <ul className="grid max-h-52 grid-cols-8 gap-0.5 overflow-y-auto p-2">
        {shown.map((emoji) => (
          <li key={emoji}>
            <button
              type="button"
              onClick={() => onPick(emoji)}
              aria-label={`Insert ${emoji}`}
              className="w-full rounded-lg p-1 text-xl leading-none transition-transform hover:scale-125 hover:bg-[var(--surface-muted)]"
            >
              {emoji}
            </button>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="col-span-8 py-6 text-center text-sm text-[var(--ink-muted)]">
            Nothing matches.
          </li>
        )}
      </ul>
    </div>
  );
}
