"use client";

import { useState, useTransition } from "react";
import {
  banMember,
  deleteMember,
  setRole,
  setVisibility,
  unbanMember,
} from "../actions";
import { useToast } from "@/components/toast";

export type AdminMember = {
  id: string;
  role: string;
  banned: boolean;
  visible: boolean;
};

/**
 * The controls beside one member.
 *
 * What is offered depends on who is looking - only an admin sees the role
 * picker - but that is a matter of not showing useless buttons. Every rule is
 * enforced again in the action, because a hidden control is not a permission.
 */
export function MemberControls({
  member,
  viewerIsAdmin,
  isSelf,
}: {
  member: AdminMember;
  viewerIsAdmin: boolean;
  isSelf: boolean;
}) {
  const toast = useToast();
  const [banning, setBanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function run(work: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await work();
      if (result?.error) toast(result.error);
    });
  }

  if (deleting) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span style={{ color: "var(--gh-danger)" }}>
          Delete permanently? Their posts, messages, photos and matches go too.
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            run(() => deleteMember(member.id));
            setDeleting(false);
          }}
          className="gh-btn gh-btn-danger"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => setDeleting(false)}
          className="gh-btn"
        >
          Cancel
        </button>
      </span>
    );
  }

  if (banning) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (shown to nobody but staff)"
          maxLength={200}
          className="gh-input max-w-64"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            run(() => banMember(member.id, reason));
            setBanning(false);
          }}
          className="gh-btn gh-btn-danger"
        >
          Ban
        </button>
        <button
          type="button"
          onClick={() => setBanning(false)}
          className="gh-btn"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      {viewerIsAdmin && !isSelf && (
        <select
          value={member.role}
          disabled={pending}
          onChange={(event) =>
            run(() => setRole(member.id, event.target.value))
          }
          className="gh-input w-auto py-1 text-xs"
          aria-label="Role"
        >
          <option value="USER">user</option>
          <option value="MODERATOR">moderator</option>
          <option value="ADMIN">admin</option>
        </select>
      )}

      {!member.banned && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setVisibility(member.id, !member.visible))}
          className="gh-btn"
        >
          {member.visible ? "Hide from Discover" : "Show in Discover"}
        </button>
      )}

      {viewerIsAdmin && !isSelf && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setDeleting(true)}
          className="gh-btn gh-btn-danger"
        >
          Delete
        </button>
      )}

      {isSelf ? (
        <span className="gh-label">you</span>
      ) : member.banned ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => unbanMember(member.id))}
          className="gh-btn"
        >
          Unban
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setBanning(true)}
          className="gh-btn gh-btn-danger"
        >
          Ban
        </button>
      )}
    </span>
  );
}
