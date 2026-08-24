"use client";

import { useActionState } from "react";
import { createGroup, type GroupState } from "../actions";

export function NewGroupForm() {
  const [state, formAction, pending] = useActionState<GroupState, FormData>(
    createGroup,
    {},
  );

  return (
    <form action={formAction} className="card space-y-4 p-4">
      <label className="block">
        <span className="label">Name</span>
        <input
          required
          name="name"
          minLength={3}
          maxLength={80}
          placeholder="Sailing on Niegocin"
          className="input mt-1"
        />
      </label>

      <label className="block">
        <span className="label">What is it for?</span>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          placeholder="Who it is for, and what you will post here."
          className="input mt-1 resize-none"
        />
      </label>

      <fieldset>
        <legend className="label">Who can join</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="chip">
            <input type="radio" name="visibility" value="PUBLIC" defaultChecked className="sr-only" />
            Public — anyone can find and join
          </label>
          <label className="chip">
            <input type="radio" name="visibility" value="PRIVATE" className="sr-only" />
            Private — invitation only
          </label>
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Creating…" : "Create group"}
      </button>
    </form>
  );
}
