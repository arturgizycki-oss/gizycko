"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Watch one conversation for anything worth reacting to.
 *
 * Asks a small endpoint rather than re-fetching the page, which is what makes
 * asking every couple of seconds reasonable: the answer is three fields, and
 * the page is only pulled again when one of them says something changed. The
 * old arrangement re-rendered the whole route on a timer, which is why the
 * timer had to be thirty seconds and why a message sat unseen for that long.
 *
 * A push over the socket calls `check` immediately, so where that is
 * configured this is a floor rather than the mechanism. Where it is not, this
 * is the whole of it - and two seconds is close enough to instant that nobody
 * is left wondering whether their message arrived.
 */

/** How often to ask while the conversation is open and being looked at. */
const EVERY_MS = 2000;

type State = {
  lastId: string | null;
  lastRead: boolean | null;
  typing: boolean;
};

export function useChatState(matchId: string, onChanged: () => void) {
  const [typing, setTyping] = useState(false);

  // Held in a ref so a changing callback never restarts the timer, and
  // assigned in an effect rather than during render.
  const changed = useRef(onChanged);
  useEffect(() => {
    changed.current = onChanged;
  });

  const seen = useRef<State | null>(null);

  const check = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/${matchId}`, {
        cache: "no-store",
      });
      if (!response.ok) return;

      const next = (await response.json()) as State;
      setTyping(Boolean(next.typing));

      const before = seen.current;
      seen.current = next;

      // Only pull the conversation again when something about it actually
      // moved: a new message, or the other side having read the last one.
      if (
        before &&
        (before.lastId !== next.lastId || before.lastRead !== next.lastRead)
      ) {
        changed.current();
      }
    } catch {
      // Offline, or the tab is closing. The next tick tries again.
    }
  }, [matchId]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer === null) timer = setInterval(check, EVERY_MS);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    function onVisibility() {
      if (document.visibilityState === "visible") {
        start();
        void check();
      } else {
        // A conversation nobody is looking at does not need watching, and a
        // tab left open overnight should not ask every two seconds until dawn.
        stop();
        setTyping(false);
      }
    }

    if (document.visibilityState === "visible") {
      // Asked on a tick rather than inline, so the first answer arrives as a
      // callback from outside React instead of during the effect itself.
      timer = setInterval(check, EVERY_MS);
      queueMicrotask(() => void check());
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [check]);

  return { typing, check };
}

/**
 * Tell the server you are typing, at most once every few seconds.
 *
 * The throttle is the point: this is called on every keystroke and must not
 * become a write on every keystroke.
 */
export function useTypingSignal(send: () => void, everyMs = 3000) {
  const last = useRef(0);
  const latest = useRef(send);

  useEffect(() => {
    latest.current = send;
  });

  return useCallback(() => {
    const now = Date.now();
    if (now - last.current < everyMs) return;
    last.current = now;
    latest.current();
  }, [everyMs]);
}
