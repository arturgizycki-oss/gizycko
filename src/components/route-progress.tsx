"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A thin bar across the top while a navigation is in flight.
 *
 * Pages here are server-rendered, so between clicking a link and the new page
 * arriving there is otherwise no feedback at all and the click feels dead.
 *
 * Completion needs no effect: the bar is keyed by the current URL, so arriving
 * anywhere remounts it in its hidden state.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();

  return <Bar key={`${pathname}?${search}`} />;
}

function Bar() {
  const [progress, setProgress] = useState(0);
  const creeping = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function start() {
      if (creeping.current) return;

      setProgress(8);
      // Ease towards 90% and wait there; the remount on arrival finishes it.
      creeping.current = setInterval(() => {
        setProgress((current) => current + Math.max(0.4, (90 - current) / 12));
      }, 140);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const link = (event.target as HTMLElement | null)?.closest?.("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page: nothing will load, so nothing to report.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      if (creeping.current) clearInterval(creeping.current);
    };
  }, []);

  if (progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="fixed inset-x-0 top-0 z-[100] h-0.5"
    >
      <div
        className="h-full bg-brand-600 transition-[width] duration-150 ease-out"
        style={{ width: `${Math.min(progress, 92)}%` }}
      />
    </div>
  );
}
