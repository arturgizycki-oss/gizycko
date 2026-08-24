"use client";

import { useState, useTransition } from "react";
import { blockUser } from "@/lib/actions/safety";

export function BlockButton({ userId }: { userId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return <span className="text-xs text-neutral-500">Blocked</span>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-neutral-500 hover:text-rose-600"
      >
        Block
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-neutral-500">Block them?</span>
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
        Yes
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-neutral-500 hover:underline"
      >
        No
      </button>
    </span>
  );
}
