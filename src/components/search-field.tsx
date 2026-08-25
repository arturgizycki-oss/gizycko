"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/provider";

/** How long typing has to pause before the query is sent. */
const DEBOUNCE_MS = 300;

/**
 * A search box that keeps the query in the URL.
 *
 * The URL is the state, so a search survives a reload, can be linked to, and
 * lets the page do the filtering in SQL rather than shipping every row to the
 * browser to sift through. Typing is debounced so a five-letter word costs one
 * request, not five.
 */
export function SearchField({
  placeholder,
  initial = "",
  paramName = "q",
}: {
  placeholder: string;
  initial?: string;
  paramName?: string;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  // Holds the query the URL already has, so the debounce can skip a no-op push.
  const applied = useRef(initial);

  useEffect(() => {
    if (value === applied.current) return;

    const id = setTimeout(() => {
      applied.current = value;

      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set(paramName, value.trim());
      else next.delete(paramName);

      const query = next.toString();
      startTransition(() =>
        router.replace(query ? `${pathname}?${query}` : pathname),
      );
    }, DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [value, params, pathname, paramName, router]);

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input pr-16"
      />

      {pending && (
        <span className="hint absolute inset-y-0 right-3 flex items-center">
          {t("action.loading")}
        </span>
      )}
    </div>
  );
}
