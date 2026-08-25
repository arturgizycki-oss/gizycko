"use client";

import { Badge } from "./nav-links";
import { useUnread } from "./unread";

/**
 * The count on the bell.
 *
 * Split out so the header can stay a server component while this one number
 * keeps itself up to date.
 */
export function NotificationBell() {
  const { notifications } = useUnread();
  return <Badge count={notifications} onBrand={false} />;
}
