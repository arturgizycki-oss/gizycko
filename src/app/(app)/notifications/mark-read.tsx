"use client";

import { useEffect, useRef } from "react";
import { markAllNotificationsRead } from "./actions";
import { useUnreadRefresh } from "@/components/unread";

/**
 * Marks everything read once the page has actually been shown. Doing this
 * during render would be a write on a GET, and it would run before the layout
 * had computed the unread badge - leaving a stale count in the header.
 */
export function MarkRead({ unread }: { unread: number }) {
  const done = useRef(false);
  const refreshUnread = useUnreadRefresh();

  useEffect(() => {
    if (done.current || unread === 0) return;
    done.current = true;
    // Clear the bell as soon as the write lands, rather than on the next poll.
    void markAllNotificationsRead().then(refreshUnread);
  }, [unread, refreshUnread]);

  return null;
}
