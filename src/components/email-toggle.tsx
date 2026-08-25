"use client";

import { useState, useTransition } from "react";
import { setEmailOnMessage } from "@/lib/actions/notifications";
import { useToast } from "@/components/toast";
import { useT } from "@/lib/i18n/provider";

/**
 * Whether to be emailed about messages that arrive while you are away.
 *
 * The switch moves as soon as it is pressed rather than waiting for the round
 * trip, and moves back if the save fails, because a control that lags behind
 * the finger gets pressed twice.
 */
export function EmailToggle({ enabled }: { enabled: boolean }) {
  const t = useT();
  const toast = useToast();
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);

    startTransition(async () => {
      try {
        await setEmailOnMessage(next);
      } catch {
        setOn(!next);
        toast(t("settings.emailSaveFailed"));
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={pending}
      onClick={toggle}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-muted)] disabled:opacity-60"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">
          {t("settings.emailOnMessage")}
        </span>
        <span className="hint">{t("settings.emailOnMessageHint")}</span>
      </span>

      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? "bg-brand-500" : "bg-[var(--line)]"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
