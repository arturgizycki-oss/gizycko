"use client";

import { useActionState, useTransition } from "react";
import { deleteGroup, updateGroup, type GroupState } from "../actions";
import { CollapsibleSection } from "@/components/collapsible-section";

export function GroupSettings({
  groupId,
  name,
  description,
  visibility,
  canDelete,
}: {
  groupId: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  canDelete: boolean;
}) {
  const action = updateGroup.bind(null, groupId);
  const [state, formAction, pending] = useActionState<GroupState, FormData>(
    action,
    {},
  );
  const [deleting, startDelete] = useTransition();

  return (
    <CollapsibleSection title="Group settings" hint="owners and admins">
      <form action={formAction} className="space-y-4 px-2 py-2">
        <label className="block">
          <span className="label">Name</span>
          <input
            required
            name="name"
            minLength={3}
            maxLength={80}
            defaultValue={name}
            className="input mt-1"
          />
        </label>

        <label className="block">
          <span className="label">Description</span>
          <textarea
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={description ?? ""}
            className="input mt-1 resize-none"
          />
        </label>

        <fieldset>
          <legend className="label">Who can join</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="chip">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                defaultChecked={visibility === "PUBLIC"}
                className="sr-only"
              />
              Public
            </label>
            <label className="chip">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                defaultChecked={visibility === "PRIVATE"}
                className="sr-only"
              />
              Private
            </label>
          </div>
        </fieldset>

        {state.error && (
          <p role="alert" className="text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {canDelete && (
        <div className="mt-2 border-t border-[var(--line)] px-2 pt-3">
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!confirm("Delete this group and every post in it? This cannot be undone.")) return;
              startDelete(() => deleteGroup(groupId));
            }}
            className="text-xs text-rose-600 hover:underline disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete this group"}
          </button>
        </div>
      )}
    </CollapsibleSection>
  );
}
