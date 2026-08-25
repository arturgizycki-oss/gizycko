"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/provider";

/**
 * A button that asks before it acts.
 *
 * Two steps in place rather than a native confirm() dialog: the question is
 * translated, it appears where the reader is already looking, and it cannot be
 * suppressed by a browser setting the way a repeated confirm() can.
 *
 * Wrap a server action with `formAction`, or pass `onConfirm` for a callback.
 * The question replaces the button until it is answered, so nothing moves
 * around it.
 */
export function ConfirmButton({
  label,
  icon,
  question,
  className,
  destructive = false,
  disabled = false,
  onConfirm,
  formAction,
}: {
  label: string;
  /** Drawn before the label, so the control reads at a glance. */
  icon?: React.ReactNode;
  question: string;
  className?: string;
  destructive?: boolean;
  disabled?: boolean;
  onConfirm?: () => void;
  /** A server action to submit when confirmed. */
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [asking, setAsking] = useState(false);
  const wrapper = useRef<HTMLSpanElement>(null);

  // Clicking elsewhere means the reader moved on; take the question away.
  useEffect(() => {
    if (!asking) return;

    function onClickAway(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setAsking(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAsking(false);
    }

    const id = setTimeout(
      () => document.addEventListener("mousedown", onClickAway),
      0,
    );
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [asking]);

  if (!asking) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAsking(true)}
        className={
          className ??
          "muted inline-flex items-center gap-1.5 text-xs hover:text-rose-600"
        }
      >
        {icon}
        {label}
      </button>
    );
  }

  const yes = (
    <span
      className={destructive ? "font-semibold text-rose-600" : "font-semibold"}
    >
      {t("confirm.yes")}
    </span>
  );

  return (
    <span ref={wrapper} className="flex flex-wrap items-center gap-2 text-xs">
      <span className="muted">{question}</span>

      {formAction ? (
        <form action={formAction}>
          <button type="submit" className="hover:underline">
            {yes}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAsking(false);
            onConfirm?.();
          }}
          className="hover:underline"
        >
          {yes}
        </button>
      )}

      <button
        type="button"
        onClick={() => setAsking(false)}
        className="muted hover:underline"
      >
        {t("confirm.no")}
      </button>
    </span>
  );
}
