"use client";

import { useActionState, useState } from "react";
import { submitReport, REPORT_REASONS, type SafetyState } from "@/lib/actions/safety";

type ReportTarget = {
  reportedUserId?: string;
  postId?: string;
  commentId?: string;
  messageId?: string;
};

export function ReportDialog({
  target,
  label = "Report",
}: {
  target: ReportTarget;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SafetyState, FormData>(
    submitReport,
    {},
  );

  if (state.ok) {
    return (
      <p className="text-xs text-emerald-600">
        Reported. Our moderators will look at it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 hover:text-rose-600"
      >
        {label}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-2 space-y-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700"
    >
      {Object.entries(target).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}

      <label className="block text-xs font-medium">
        Why are you reporting this?
        <select
          name="reason"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="" disabled>
            Choose a reason
          </option>
          {REPORT_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </label>

      <textarea
        name="details"
        rows={2}
        maxLength={2000}
        placeholder="Anything else we should know? (optional)"
        className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />

      {state.error && (
        <p role="alert" className="text-xs text-rose-600">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
