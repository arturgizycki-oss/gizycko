"use client";

import { useTransition } from "react";
import { unblockUser } from "@/lib/actions/safety";

export function UnblockButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => unblockUser(userId))}
      className="btn btn-secondary btn-sm"
    >
      {pending ? "Unblocking…" : "Unblock"}
    </button>
  );
}
