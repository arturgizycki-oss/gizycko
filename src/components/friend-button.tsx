"use client";

import { useTransition } from "react";
import {
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "@/lib/actions/friends";

export type FriendState = "none" | "requested" | "incoming" | "friends";

export function FriendButton({
  userId,
  state,
  friendshipId,
}: {
  userId: string;
  state: FriendState;
  friendshipId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  const base =
    "rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-60";

  if (state === "friends") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removeFriend(userId))}
        className={`${base} border border-neutral-300 dark:border-neutral-700`}
      >
        Friends · remove
      </button>
    );
  }

  if (state === "requested") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removeFriend(userId))}
        className={`${base} border border-neutral-300 dark:border-neutral-700`}
      >
        Request sent · cancel
      </button>
    );
  }

  if (state === "incoming" && friendshipId) {
    return (
      <span className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => respondToFriendRequest(friendshipId, true))
          }
          className={`${base} bg-rose-600 text-white`}
        >
          Accept
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => respondToFriendRequest(friendshipId, false))
          }
          className={`${base} border border-neutral-300 dark:border-neutral-700`}
        >
          Decline
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => sendFriendRequest(userId))}
      className={`${base} bg-rose-600 text-white`}
    >
      Add friend
    </button>
  );
}
