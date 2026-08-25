"use client";

import { useEffect, useState } from "react";
import { CheckIcon, LinkIcon } from "./icons";
import { useT } from "@/lib/i18n/provider";

/**
 * Copies a link to the clipboard and says so for a moment.
 *
 * `path` is site-relative ("/feed/abc"); the absolute URL is built in the
 * browser, because that is the only place that knows which host the reader is
 * actually on - localhost in development, the real domain in production.
 */
export function CopyLink({
  path,
  label,
}: {
  path: string;
  /** Shown beside the icon. Omit for an icon-only button. */
  label?: string;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function copy() {
    const url = new URL(path, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be refused (an insecure origin, or a permission
      // prompt declined). Falling back to a prompt still lets people copy.
      window.prompt(t("action.copyLink"), url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={t("action.copyLink")}
      aria-label={t("action.copyLink")}
      className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
    >
      {copied ? (
        <CheckIcon className="size-4 text-emerald-600" />
      ) : (
        <LinkIcon className="size-4" />
      )}
      {label !== undefined && (
        <span>{copied ? t("action.copied") : label}</span>
      )}
      {/* Announced without taking up room in the row. */}
      <span aria-live="polite" className="sr-only">
        {copied ? t("action.copied") : ""}
      </span>
    </button>
  );
}
