const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Compact "when" label for lists: 5m, 3h, Tue, 14 Mar. Computed on the server
 * and rendered as plain text, so there is nothing for the client to disagree
 * with at hydration.
 */
export function shortWhen(date: Date, now = new Date()): string {
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE) return "now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < WEEK) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

/**
 * A complete phrase for how long ago something happened. shortWhen returns bare
 * units for tight lists ("5m"); appending " ago" to those produces "now ago".
 */
export function timeAgo(date: Date, now = new Date()): string {
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} minutes ago`;
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  }
  if (elapsed < WEEK) {
    const days = Math.floor(elapsed / DAY);
    return days === 1 ? "yesterday" : `${days} days ago`;
  }

  return `on ${shortWhen(date, now)}`;
}
