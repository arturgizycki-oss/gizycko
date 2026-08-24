"use client";

import { useState, useTransition } from "react";
import { banUser, unbanUser } from "./actions";

export function BanControls({
  userId,
  banned,
}: {
  userId: string;
  banned: boolean;
}) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (banned) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => unbanUser(userId))}
        className="text-xs text-emerald-600 hover:underline disabled:opacity-60"
      >
        Unban
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-rose-600 hover:underline"
      >
        Ban
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason"
        maxLength={200}
        className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-950"
      />
      <button
        type="button"
        disabled={pending || reason.trim().length === 0}
        onClick={() =>
          startTransition(async () => {
            await banUser(userId, reason.trim());
            setOpen(false);
          })
        }
        className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-60"
      >
        Confirm ban
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-neutral-500 hover:underline"
      >
        Cancel
      </button>
    </span>
  );
}
