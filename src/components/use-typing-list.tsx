"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * The conversations somebody is writing in, for a list of them.
 *
 * One request for the whole list on a slow tick, because a list is glanced at
 * rather than watched - four seconds is soon enough for a preview line, and
 * half the traffic of the two seconds an open conversation uses.
 *
 * Stops while the tab is hidden. An inbox left open in a background tab should
 * not ask anything at all.
 */
const EVERY_MS = 4000;

export function useTypingList(): Set<string> {
  const [typing, setTyping] = useState<Set<string>>(() => new Set());
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function check() {
      try {
        const response = await fetch("/api/typing", { cache: "no-store" });
        if (!response.ok || !alive.current) return;

        const body = (await response.json()) as { typing?: string[] };
        const next = new Set(body.typing ?? []);

        // Replace only on a real change, so a list that nobody is writing in
        // does not re-render every four seconds for ever.
        setTyping((current) =>
          current.size === next.size && [...next].every((id) => current.has(id))
            ? current
            : next,
        );
      } catch {
        // Offline, or the tab is closing. The next tick tries again.
      }
    }

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
        stop();
      }
    }

    if (document.visibilityState === "visible") {
      timer = setInterval(check, EVERY_MS);
      queueMicrotask(() => void check());
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive.current = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return typing;
}

const TypingContext = createContext<Set<string> | null>(null);

/**
 * One watcher for a whole list.
 *
 * Without this every row would run its own, and an inbox of thirty
 * conversations would be thirty requests every four seconds.
 */
export function TypingProvider({ children }: { children: React.ReactNode }) {
  const typing = useTypingList();

  return (
    <TypingContext.Provider value={typing}>{children}</TypingContext.Provider>
  );
}

/** Whether somebody is writing in this conversation right now. */
export function useIsTyping(matchId: string): boolean {
  return useContext(TypingContext)?.has(matchId) ?? false;
}

/**
 * The line under a name in a list: what they are writing, or what was last
 * said. What somebody is doing now is worth more than what they said before.
 */
export function TypingPreview({
  matchId,
  label,
  children,
}: {
  matchId: string;
  label: string;
  children: React.ReactNode;
}) {
  const typing = useIsTyping(matchId);

  if (!typing) return <>{children}</>;

  return <span className="text-brand-600 dark:text-brand-400">{label}</span>;
}
