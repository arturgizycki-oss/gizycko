"use client";

import { useRouter } from "next/navigation";
import { useLive } from "@/components/live";

/**
 * Pull the feed again when somebody posts.
 *
 * A refresh re-runs the server query, so what arrives is filtered by the same
 * visibility rules as a normal load - the push says only that something was
 * posted, never what or by whom. Scroll position survives, so a new post
 * appears above without moving what is being read.
 */
export function LiveFeed() {
  const router = useRouter();
  useLive("feed", () => router.refresh());
  return null;
}
