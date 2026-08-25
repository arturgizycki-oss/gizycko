"use client";

import { useTransition } from "react";
import { useState } from "react";
import {
  banFromGroup,
  removeMember,
  setMemberRole,
  transferOwnership,
} from "../actions";
import { can, canActOn, type GroupRole } from "@/lib/group-roles";
import { ConfirmButton } from "@/components/confirm-button";
import { useT } from "@/lib/i18n/provider";

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
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [banning, setBanning] = useState(false);
  const [reason, setReason] = useState("");

  // Nobody manages themselves, and rank decides the rest.
  if (isSelf || !canActOn(actorRole, targetRole)) return null;

  const canPromote = can(actorRole, "manageAdmins");
  const canRemove = can(actorRole, "removeMember");
  const canBan = can(actorRole, "banMember");
  const canHandOver = can(actorRole, "transferOwnership");

  if (banning) {
    return (
      <span className="flex shrink-0 items-center gap-2 text-xs">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t("groups.banReason")}
          maxLength={200}
          className="input max-w-40 py-1 text-xs"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await banFromGroup(groupId, userId, reason);
              setBanning(false);
            })
          }
          className="font-semibold text-rose-600 hover:underline"
        >
          {t("groups.ban")}
        </button>
        <button
          type="button"
          onClick={() => setBanning(false)}
          className="muted hover:underline"
        >
          {t("action.cancel")}
        </button>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center justify-end gap-2 text-xs">
      {canPromote && targetRole === "MEMBER" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => setMemberRole(groupId, userId, "ADMIN"))
          }
          className="muted hover:underline"
        >
          {t("groups.makeAdmin")}
        </button>
      )}

      {canPromote && targetRole === "ADMIN" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => setMemberRole(groupId, userId, "MEMBER"))
          }
          className="muted hover:underline"
        >
          {t("groups.removeAdmin")}
        </button>
      )}

      {canHandOver && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(t("confirm.handOver"))) return;
            startTransition(() => transferOwnership(groupId, userId));
          }}
          className="muted hover:underline"
        >
          {t("groups.makeOwner")}
        </button>
      )}

      {canRemove && (
        <ConfirmButton
          label={t("action.remove")}
          question={t("confirm.removeMember")}
          destructive
          disabled={pending}
          className="muted hover:text-rose-600 hover:underline"
          onConfirm={() => startTransition(() => removeMember(groupId, userId))}
        />
      )}

      {canBan && (
        <button
          type="button"
          onClick={() => setBanning(true)}
          className="text-rose-600 hover:underline"
        >
          {t("groups.ban")}
        </button>
      )}
    </span>
  );
}
