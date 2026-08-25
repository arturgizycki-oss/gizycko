"use client";

import { useTransition } from "react";
import { unblockUser } from "@/lib/actions/safety";
import { useT } from "@/lib/i18n/provider";

export function UnblockButton({ userId }: { userId: string }) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => unblockUser(userId))}
      className="btn btn-secondary btn-sm"
    >
      {pending ? t("action.unblocking") : t("action.unblock")}
    </button>
  );
}
