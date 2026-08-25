"use client";

import { useTransition } from "react";
import {
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "@/lib/actions/friends";
import { useT } from "@/lib/i18n/provider";

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
  const t = useT();
  const [pending, startTransition] = useTransition();

  const base = "btn btn-sm";

  if (state === "friends") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removeFriend(userId))}
        className={`${base} btn-secondary`}
      >
        {t("friends.friendsRemove")}
      </button>
    );
  }

  if (state === "requested") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removeFriend(userId))}
        className={`${base} btn-secondary`}
      >
        {t("friends.requestedCancel")}
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
          className={`${base} btn-primary`}
        >
          {t("action.accept")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => respondToFriendRequest(friendshipId, false))
          }
          className={`${base} btn-secondary`}
        >
          {t("action.decline")}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => sendFriendRequest(userId))}
      className={`${base} btn-primary`}
    >
      {t("friends.add")}
    </button>
  );
}
