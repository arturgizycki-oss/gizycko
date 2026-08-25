"use client";

import { useTransition } from "react";
import { joinGroup, leaveGroup } from "../actions";
import { useT } from "@/lib/i18n/provider";

export function JoinLeave({
  groupId,
  role,
  canJoin,
}: {
  groupId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | null;
  canJoin: boolean;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  // The owner cannot leave; the group would be left without one.
  if (role === "OWNER") {
    return <span className="hint shrink-0">{t("groups.youOwn")}</span>;
  }

  if (role) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => leaveGroup(groupId))}
        className="btn btn-secondary btn-sm shrink-0"
      >
        {pending ? t("groups.leaving") : t("action.leave")}
      </button>
    );
  }

  if (!canJoin) {
    return <span className="hint shrink-0">{t("groups.inviteOnly")}</span>;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => joinGroup(groupId))}
      className="btn btn-primary btn-sm shrink-0"
    >
      {pending ? t("groups.joining") : t("action.join")}
    </button>
  );
}
