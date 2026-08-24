"use client";

import { useTransition } from "react";
import { toggleFollow } from "@/lib/actions/follows";

export function FollowButton({
  userId,
  following,
}: {
  userId: string;
  following: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={following}
      onClick={() => startTransition(() => toggleFollow(userId))}
      className={following ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
