"use client";

import { useState, useTransition } from "react";
import { blockUser } from "@/lib/actions/safety";
import { useT } from "@/lib/i18n/provider";
import { BanIcon } from "./icons";

export function BlockButton({ userId }: { userId: string }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <span className="text-xs text-neutral-500">{t("action.blocked")}</span>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-rose-600"
      >
        <BanIcon className="size-3.5" />
        {t("action.block")}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-neutral-500">{t("action.blockConfirm")}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await blockUser(userId);
            setDone(true);
          })
        }
        className="font-semibold text-rose-600 hover:underline disabled:opacity-60"
      >
        {t("action.yes")}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-neutral-500 hover:underline"
      >
        {t("action.no")}
      </button>
    </span>
  );
}
