"use client";

import { useTransition } from "react";
import { respondToInvite } from "./actions";
import { useT } from "@/lib/i18n/provider";

export function InviteResponse({ inviteId }: { inviteId: string }) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <span className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => respondToInvite(inviteId, true))}
        className="btn btn-primary btn-sm"
      >
        {t("action.join")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => respondToInvite(inviteId, false))}
        className="btn btn-secondary btn-sm"
      >
        {t("action.decline")}
      </button>
    </span>
  );
}
