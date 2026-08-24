"use client";

import { useTransition } from "react";
import { respondToInvite } from "./actions";

export function InviteResponse({ inviteId }: { inviteId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <span className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => respondToInvite(inviteId, true))}
        className="btn btn-primary btn-sm"
      >
        Join
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => respondToInvite(inviteId, false))}
        className="btn btn-secondary btn-sm"
      >
        Decline
      </button>
    </span>
  );
}
