"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type PostState } from "../actions";
import { useT } from "@/lib/i18n/provider";
import { useErrorToast } from "@/components/toast";

export function CommentForm({ postId }: { postId: string }) {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const action = addComment.bind(null, postId);
  const [state, formAction, pending] = useActionState<PostState, FormData>(
    action,
    {},
  );
  useErrorToast(state.error, state.submissionId);

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
        placeholder={t("feed.commentPlaceholder")}
        className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
      />

      <button type="submit" disabled={pending} className="btn btn-primary mt-2">
        {pending ? t("action.posting") : t("feed.comment")}
      </button>
    </form>
  );
}
