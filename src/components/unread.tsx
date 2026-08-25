"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLive } from "./live";

export type Unread = { notifications: number; messages: number };

const UnreadContext = createContext<Unread | null>(null);

/** How often to ask, while the tab is being looked at. */
const POLL_MS = 30_000;

/**
 * Keeps the header badges current without a page load.
 *
 * The counts start as the server rendered them, so the first paint is right and
 * there is no flicker from nothing to a number. After that this refreshes them,
 * because a layout is only rebuilt on navigation and somebody reading their feed
 * would otherwise not hear about a like until they clicked something.
 *
 * Polling stops while the tab is hidden - a background tab asking every thirty
 * seconds for hours is a waste of the member's battery and our database - and
 * asks once immediately on return, which is exactly when the answer is stale.
 */
export function UnreadProvider({
  initial,
  children,
}: {
  initial: Unread;
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/unread", { cache: "no-store" });
      if (!response.ok) return;

      const next = (await response.json()) as Partial<Unread>;
      if (
        typeof next.notifications === "number" &&
        typeof next.messages === "number"
      ) {
        setCounts({
          notifications: next.notifications,
          messages: next.messages,
        });
      }
    } catch {
      // Offline, or the tab is being closed. The next tick tries again.
    }
  }, []);

  // A push arrives the moment something happens; the poll below is the net
  // that catches whatever the socket missed while it was down.
  useLive("message", refresh);
  useLive("notification", refresh);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer === null) timer = setInterval(refresh, POLL_MS);
    }

    function stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void refresh();
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return (
    <UnreadContext.Provider value={counts}>{children}</UnreadContext.Provider>
  );
}

/**
 * The live counts, falling back to zero outside a provider so a component can
 * be rendered in a test without one.
 */
export function useUnread(): Unread {
  return useContext(UnreadContext) ?? { notifications: 0, messages: 0 };
}
