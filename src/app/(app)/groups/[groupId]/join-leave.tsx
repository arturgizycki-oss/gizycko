"use client";

import { useTransition } from "react";
import { joinGroup, leaveGroup } from "../actions";

export function JoinLeave({
  groupId,
  role,
  canJoin,
}: {
  groupId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | null;
  canJoin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  // The owner cannot leave; the group would be left without one.
  if (role === "OWNER") {
    return <span className="hint shrink-0">You own this group</span>;
  }

  if (role) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => leaveGroup(groupId))}
        className="btn btn-secondary btn-sm shrink-0"
      >
        {pending ? "Leaving…" : "Leave"}
      </button>
    );
  }

  if (!canJoin) {
    return <span className="hint shrink-0">Invitation only</span>;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => joinGroup(groupId))}
      className="btn btn-primary btn-sm shrink-0"
    >
      {pending ? "Joining…" : "Join"}
    </button>
  );
}
