"use client";

import { useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { unbanFromGroup } from "../actions";

export type BannedPerson = {
  userId: string;
  name: string;
  photo: string | null;
  reason: string | null;
};

export function BannedList({
  groupId,
  people,
}: {
  groupId: string;
  people: BannedPerson[];
}) {
  const [pending, startTransition] = useTransition();

  if (people.length === 0) {
    return <p className="muted px-2 py-3 text-sm">Nobody is banned.</p>;
  }

  return (
    <ul className="space-y-1">
      {people.map((person) => (
        <li key={person.userId} className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={person.name} src={person.photo} size={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{person.name}</span>
            <span className="hint">{person.reason ?? "No reason given"}</span>
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => unbanFromGroup(groupId, person.userId))}
            className="btn btn-secondary btn-sm shrink-0"
          >
            Unban
          </button>
        </li>
      ))}
    </ul>
  );
}
