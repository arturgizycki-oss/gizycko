"use client";

import { useEffect, useRef } from "react";
import { markAllNotificationsRead } from "./actions";

/**
 * Marks everything read once the page has actually been shown. Doing this
 * during render would be a write on a GET, and it would run before the layout
 * had computed the unread badge — leaving a stale count in the header.
 */
export function MarkRead({ unread }: { unread: number }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || unread === 0) return;
    done.current = true;
    void markAllNotificationsRead();
  }, [unread]);

  return null;
}
