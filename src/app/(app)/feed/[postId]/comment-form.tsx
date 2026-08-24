"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type PostState } from "../actions";

export function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = addComment.bind(null, postId);
  const [state, formAction, pending] = useActionState<PostState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="mt-4">
      <textarea
        name="body"
        rows={2}
        required
        maxLength={2000}
        placeholder="Write a comment…"
        className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
      />

      {state.error && (
        <p role="alert" className="mt-1 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary mt-2"
      >
        {pending ? "Posting…" : "Comment"}
      </button>
    </form>
  );
}
