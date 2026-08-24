"use client";

import { useActionState, useRef, useEffect } from "react";
import { createPost, type PostState } from "./actions";

export function Composer() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<PostState, FormData>(
    createPost,
    {},
  );

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <textarea
        name="body"
        rows={3}
        maxLength={5000}
        required
        placeholder="What is going on?"
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-neutral-400"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="text-xs text-neutral-500">
          Visible to{" "}
          <select
            name="visibility"
            defaultValue="FRIENDS"
            className="rounded border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
          >
            <option value="FRIENDS">Friends</option>
            <option value="MATCHES">Matches</option>
            <option value="PUBLIC">Everyone</option>
            <option value="PRIVATE">Only me</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
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
