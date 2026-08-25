"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_GROUPS, searchEmoji } from "@/lib/emoji";

/**
 * Emoji keyboard.
 *
 * Positioned against whichever element wraps it, so it must be rendered inside
 * a `relative` container around the button that opens it — not at the top of a
 * form, or it lands wherever that form happens to start.
 */
export function EmojiPicker({
  onPick,
  onClose,
  placement = "top",
  align = "left",
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
  /** Above the button, or below it when there is no room above. */
  placement?: "top" | "bottom";
  /** Which edge it lines up with, so it does not run off the side. */
  align?: "left" | "right";
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
  const shown = searching ? searchEmoji(query) : EMOJI_GROUPS[group].emoji;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Choose an emoji"
      className={[
        "card absolute z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden",
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
        align === "left" ? "left-0" : "right-0",
      ].join(" ")}
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

      <div className="px-2 pt-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search: face, heart, food…"
          aria-label="Search emoji"
          className="input py-1.5 text-xs"
        />
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
