"use client";

import { useState, useTransition } from "react";
import { inviteToGroup } from "../actions";

export function InviteFriend({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) return <span className="hint shrink-0">Invited</span>;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await inviteToGroup(groupId, userId);
          setSent(true);
        })
      }
      className="btn btn-secondary btn-sm shrink-0"
    >
      Invite
    </button>
  );
}
