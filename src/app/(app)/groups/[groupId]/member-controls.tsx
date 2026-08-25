"use client";

import { useTransition } from "react";
import { removeMember, setMemberRole, transferOwnership } from "../actions";
import { can, canActOn, type GroupRole } from "@/lib/group-roles";

/**
 * Role controls beside a member. Everything here is also enforced on the
 * server; this only decides what is worth showing.
 */
export function MemberControls({
  groupId,
  userId,
  actorRole,
  targetRole,
  isSelf,
}: {
  groupId: string;
  userId: string;
  actorRole: GroupRole | null;
  targetRole: GroupRole;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  // Nobody manages themselves, and rank decides the rest.
  if (isSelf || !canActOn(actorRole, targetRole)) return null;

  const canPromote = can(actorRole, "manageAdmins");
  const canRemove = can(actorRole, "removeMember");
  const canHandOver = can(actorRole, "transferOwnership");

  return (
    <span className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
      {canPromote && targetRole === "MEMBER" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setMemberRole(groupId, userId, "ADMIN"))}
          className="muted hover:underline"
        >
          Make admin
        </button>
      )}

      {canPromote && targetRole === "ADMIN" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setMemberRole(groupId, userId, "MEMBER"))}
          className="muted hover:underline"
        >
          Remove admin
        </button>
      )}

      {canHandOver && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Hand the group over? You become an admin.")) return;
            startTransition(() => transferOwnership(groupId, userId));
          }}
          className="muted hover:underline"
        >
          Make owner
        </button>
      )}

      {canRemove && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => removeMember(groupId, userId))}
          className="text-rose-600 hover:underline"
        >
          Remove
        </button>
      )}
    </span>
  );
}
