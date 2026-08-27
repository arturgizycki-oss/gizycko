"use client";

import { useSyncExternalStore } from "react";

/**
 * A time, in the reader's own clock.
 *
 * Formatting a date in a server component uses the server's timezone, and the
 * server runs on UTC - so a member in Warsaw was told their own post was
 * written two hours before they wrote it, and one in Beijing eight. Nobody
 * outside London saw a correct time anywhere except the chat, which had always
 * formatted in the browser.
 *
 * The formatting therefore has to happen where the clock is. The server renders
 * nothing and the browser fills it in, which is deliberate rather than lazy: a
 * server-rendered guess would differ from the client's and hydrate into a
 * mismatch, and the reader would watch the time correct itself.
 *
 * `dateTime` carries the real instant either way, so a screen reader and any
 * other machine reading the page get the unambiguous version.
 */

const subscribe = () => () => {};

export function LocalTime({
  value,
  locale,
  mode = "datetime",
  className,
}: {
  /** ISO 8601, in UTC. */
  value: string;
  locale: string;
  mode?: "datetime" | "time" | "date" | "month";
  className?: string;
}) {
  // False while rendering on the server, true once the browser takes over.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const text = mounted ? format(value, locale, mode) : "";

  return (
    <time dateTime={value} className={className}>
      {text}
    </time>
  );
}

function format(value: string, locale: string, mode: string): string {
  const date = new Date(value);

  if (mode === "time") {
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (mode === "date") return date.toLocaleDateString(locale);

  if (mode === "month") {
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }

  return date.toLocaleString(locale);
}
