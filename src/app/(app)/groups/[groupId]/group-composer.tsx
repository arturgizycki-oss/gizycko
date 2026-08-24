"use client";

import { useActionState } from "react";
import { postToGroup, type GroupState } from "../actions";

export function GroupComposer({ groupId }: { groupId: string }) {
  const action = postToGroup.bind(null, groupId);
  const [state, formAction, pending] = useActionState<GroupState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="card p-4">
      <textarea
        name="body"
        rows={3}
        required
        maxLength={5000}
        placeholder="Share something with the group"
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--ink-muted)]"
      />

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
        <span className="hint">Only members can see this.</span>
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Posting…" : "Post"}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
