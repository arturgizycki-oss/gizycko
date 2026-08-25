"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  CopyIcon,
  FlagIcon,
  LinkIcon,
  MoreIcon,
  PencilIcon,
  ReplyIcon,
  TrashIcon,
} from "./icons";
import { EMOJI_GROUPS } from "@/lib/emoji";
import { useT } from "@/lib/i18n/provider";

export type MessageAction = {
  key: string;
  label: string;
  icon: "reply" | "edit" | "copy" | "link" | "delete" | "report";
  onSelect: () => void;
  /** Renders in red, for the one action that destroys something. */
  destructive?: boolean;
  /** Shown as a second step before the action runs. */
  confirm?: string;
};

const ICONS = {
  reply: ReplyIcon,
  edit: PencilIcon,
  copy: CopyIcon,
  link: LinkIcon,
  delete: TrashIcon,
  report: FlagIcon,
};

const WIDTH = 248;
const GAP = 8;
const MARGIN = 8;
const ROW = 40;
/** The reaction row, and the category tabs under it once the drawer is open. */
const QUICK_ROW = 40;
const TABS_ROW = 38;
/** How much of the emoji grid is shown before it scrolls. */
const GRID_HEIGHT = 176;

/** Marks the panel the menu has to stay inside. */
export const MENU_BOUNDS_ATTR = "data-menu-bounds";

type Box = { top: number; left: number; maxHeight: number };

/**
 * The menu on a chat message: a row of reactions above a list of actions.
 *
 * The reactions live here rather than behind a second button of their own,
 * which is how the chat apps people already use are laid out, and one control
 * beside a message is less clutter than two. The chevron expands the rest of
 * the emoji inside this panel rather than opening a second floating one, so
 * nothing ever escapes the conversation.
 *
 * Which actions exist is decided by the caller, which is the only place that
 * knows whose message this is. Deleting and editing are never offered on
 * somebody else's message, and that decision does not live here.
 */
export function MessageMenu({
  actions,
  quickReactions = [],
  onReact,
}: {
  actions: MessageAction[];
  /** The handful of emoji offered without opening the full list. */
  quickReactions?: readonly string[];
  onReact?: (emoji: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [allEmoji, setAllEmoji] = useState(false);
  const [group, setGroup] = useState(0);
  const [box, setBox] = useState<Box>();

  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setConfirming(null);
    setAllEmoji(false);
  }, []);

  /*
   * Fixed to the viewport rather than absolute inside the message list.
   *
   * The list scrolls, so an absolutely positioned panel was clipped at its
   * edges and wide enough to give the list a horizontal scrollbar. Fixed
   * escapes both, and every number below is clamped to the chat panel so the
   * menu cannot spill over the conversation or off the page.
   */
  const expanded = allEmoji && quickReactions.length > 0;

  const place = useCallback((): Box | undefined => {
    const anchor = button.current?.getBoundingClientRect();
    if (!anchor) return undefined;

    const bounds = button.current
      ?.closest(`[${MENU_BOUNDS_ATTR}]`)
      ?.getBoundingClientRect();

    const ceiling = bounds?.top ?? 0;
    const floor = bounds?.bottom ?? window.innerHeight;
    const leftWall = (bounds?.left ?? 0) + MARGIN;
    const rightWall = (bounds?.right ?? window.innerWidth) - MARGIN;

    // Hang from the button's right edge, then clamp inside the panel.
    const left = Math.max(
      leftWall,
      Math.min(anchor.right - WIDTH, Math.max(leftWall, rightWall - WIDTH)),
    );

    // The panel shows the emoji drawer or the action list, so it is measured
    // for whichever one is up.
    const wanted = expanded
      ? QUICK_ROW + TABS_ROW + GRID_HEIGHT + 16
      : (actions.length + (quickReactions.length > 0 ? 1 : 0)) * ROW + 16;

    // Never taller than the panel it has to live in.
    const height = Math.min(wanted, floor - ceiling - MARGIN * 2);

    // Below the button, else above it, else pinned inside the panel. The last
    // step is what stops the bottom of the menu being cut off.
    let top = anchor.bottom + GAP;
    if (top + height > floor - MARGIN) top = anchor.top - GAP - height;
    if (top < ceiling + MARGIN) top = ceiling + MARGIN;
    if (top + height > floor - MARGIN) top = floor - MARGIN - height;

    return { left, top, maxHeight: height };
  }, [actions.length, quickReactions.length, expanded]);

  const reposition = useCallback(() => setBox(place()), [place]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    function onClickAway(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) close();
    }

    document.addEventListener("keydown", onKey);
    // Follow the message if the list moves under it.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    // Deferred, or the click that opened the menu closes it again.
    const id = setTimeout(
      () => document.addEventListener("mousedown", onClickAway),
      0,
    );

    return () => {
      clearTimeout(id);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAway);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, close, reposition]);

  if (actions.length === 0 && quickReactions.length === 0) return null;

  function run(action: MessageAction) {
    if (action.confirm && confirming !== action.key) {
      setConfirming(action.key);
      return;
    }
    close();
    action.onSelect();
  }

  function react(emoji: string) {
    close();
    onReact?.(emoji);
  }

  const showReactions = quickReactions.length > 0 && onReact;

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          // Measured here rather than in an effect, so the panel has its
          // position before it ever renders.
          setBox(place());
          setOpen(true);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("chat.messageActions")}
        className="rounded-full p-1 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
      >
        <MoreIcon className="size-4" />
      </button>

      {open && box && (
        <div
          role="menu"
          aria-label={t("chat.messageActions")}
          style={{
            top: box.top,
            left: box.left,
            width: WIDTH,
            maxHeight: box.maxHeight,
          }}
          className="card fixed z-50 overflow-hidden p-1"
        >
          {showReactions && (
            <>
              <div className="flex items-center gap-0.5 px-1 py-1">
                {quickReactions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => react(emoji)}
                    aria-label={emoji}
                    className="shrink-0 rounded-lg px-1 text-lg leading-none transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setAllEmoji((current) => !current);
                    // Height changes with it; measure on the next frame, once
                    // the new content has been laid out.
                    requestAnimationFrame(reposition);
                  }}
                  aria-label={t("chat.moreEmoji")}
                  aria-expanded={allEmoji}
                  className="ml-auto shrink-0 rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                >
                  <ChevronDownIcon
                    className={`size-4 transition-transform ${
                      allEmoji ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {allEmoji && (
                <>
                  <div className="flex gap-1 border-t border-[var(--line)] px-1 py-1">
                    {EMOJI_GROUPS.map((item, at) => (
                      <button
                        key={item.name}
                        type="button"
                        title={item.name}
                        aria-label={item.name}
                        aria-pressed={at === group}
                        onClick={() => setGroup(at)}
                        className={
                          at === group
                            ? "rounded-lg bg-[var(--surface-muted)] px-1.5 py-1 text-base"
                            : "rounded-lg px-1.5 py-1 text-base opacity-60 hover:opacity-100"
                        }
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>

                  <ul
                    style={{ maxHeight: GRID_HEIGHT }}
                    className="grid grid-cols-7 gap-0.5 overflow-y-auto px-1 pb-1"
                  >
                    {EMOJI_GROUPS[group].emoji.map((emoji) => (
                      <li key={emoji}>
                        <button
                          type="button"
                          onClick={() => react(emoji)}
                          aria-label={emoji}
                          className="w-full rounded-lg p-1 text-lg leading-none transition-transform hover:scale-125 hover:bg-[var(--surface-muted)]"
                        >
                          {emoji}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {!expanded && (
                <div className="my-1 border-t border-[var(--line)]" />
              )}
            </>
          )}

          {/*
            One or the other, never both. Stacking the emoji grid on top of the
            actions made the panel taller than the conversation it has to fit
            inside, and the bottom of the list was cut off.
          */}
          {!expanded &&
            actions.map((action) => {
              const Icon = ICONS[action.icon];
              const asking = confirming === action.key;

              return (
                <button
                  key={action.key}
                  type="button"
                  role="menuitem"
                  onClick={() => run(action)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${
                    action.destructive || asking
                      ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      : "hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">
                    {asking ? action.confirm : action.label}
                  </span>
                </button>
              );
            })}

          {!expanded && confirming && (
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]"
            >
              {t("action.cancel")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
