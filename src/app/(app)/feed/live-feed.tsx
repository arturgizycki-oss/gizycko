"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { useLive } from "@/components/live";

/**
 * Pull the feed again when somebody posts.
 *
 * A refresh re-runs the server query, so what arrives is filtered by the same
 * visibility rules as a normal load - the push says only that something was
 * posted, never what or by whom. Scroll position survives, so a new post
 * appears above without moving what is being read.
 *
 * Inside a transition, because there is a loading.tsx for this route: without
 * one, React swaps the feed for its skeleton while the new render is prepared,
 * and somebody reading a post has it yanked away because a stranger posted.
 */
export function LiveFeed() {
  const router = useRouter();

  useLive("feed", () => startTransition(() => router.refresh()));

  return null;
}
