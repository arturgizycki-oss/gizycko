"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type LiveEvent = "message" | "notification" | "feed";

type Subscribe = (event: LiveEvent, handler: () => void) => () => void;

const LiveContext = createContext<{
  subscribe: Subscribe;
  connected: boolean;
} | null>(null);

/**
 * One WebSocket for the whole application.
 *
 * Every part that wants live updates asks this rather than opening its own
 * connection: a browser will only hold so many, and six components each
 * connecting separately is how an app ends up slower with live updates than
 * without them.
 *
 * What arrives says only what kind of thing changed. The handler re-fetches
 * through the ordinary routes, which is what keeps a push from becoming a way
 * around the permission checks - see src/lib/realtime.ts.
 *
 * With nothing configured this renders its children and does nothing, so the
 * site works exactly as before. The polling elsewhere is the real guarantee;
 * this only makes it feel immediate.
 */
export function LiveProvider({
  topic,
  feedTopic,
  children,
}: {
  topic: string;
  feedTopic: string;
  children: React.ReactNode;
}) {
  const [connected, setConnected] = useState(false);

  // Handlers live in a ref so that adding one does not tear the socket down.
  const handlers = useRef(new Map<LiveEvent, Set<() => void>>());

  const subscribe = useCallback<Subscribe>((event, handler) => {
    const set = handlers.current.get(event) ?? new Set();
    set.add(handler);
    handlers.current.set(event, set);

    return () => {
      set.delete(handler);
    };
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    let client: SupabaseClient | null = null;

    try {
      client = createClient(url, key, {
        auth: { persistSession: false },
        // This connection is for pushes only. Ten a second is far more than
        // anything here produces and keeps a loop from flooding the browser.
        realtime: { params: { eventsPerSecond: 10 } },
      });
    } catch {
      return;
    }

    function fire(kind: unknown) {
      if (typeof kind !== "string") return;
      for (const handler of handlers.current.get(kind as LiveEvent) ?? []) {
        handler();
      }
    }

    const mine = client
      .channel(topic)
      .on("broadcast", { event: "changed" }, ({ payload }) => {
        fire((payload as { kind?: unknown })?.kind);
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    const feed = client
      .channel(feedTopic)
      .on("broadcast", { event: "changed" }, ({ payload }) => {
        fire((payload as { kind?: unknown })?.kind);
      })
      .subscribe();

    return () => {
      void client?.removeChannel(mine);
      void client?.removeChannel(feed);
      void client?.removeAllChannels();
    };
  }, [topic, feedTopic]);

  const value = useMemo(
    () => ({ subscribe, connected }),
    [subscribe, connected],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

/**
 * Run something when a kind of thing changes.
 *
 * `useLive("message", refresh)` - the handler may change on every render, so it
 * is held in a ref and the subscription is not rebuilt for it.
 */
export function useLive(event: LiveEvent, handler: () => void) {
  const context = useContext(LiveContext);
  const latest = useRef(handler);

  // Assigned in an effect, not during render: a ref written while rendering can
  // hold a value from a render React went on to throw away.
  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!context) return;
    return context.subscribe(event, () => latest.current());
  }, [context, event]);
}

/** Whether the push connection is up. Polling covers it either way. */
export function useLiveConnected(): boolean {
  return useContext(LiveContext)?.connected ?? false;
}
