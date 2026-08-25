"use client";

import { useActionState, useState } from "react";
import { submitReport, type SafetyState } from "@/lib/actions/safety";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { useT } from "@/lib/i18n/provider";
import { FlagIcon } from "./icons";
import { useErrorToast } from "@/components/toast";

type ReportTarget = {
  reportedUserId?: string;
  postId?: string;
  commentId?: string;
  messageId?: string;
};

export function ReportDialog({
  target,
  label,
}: {
  target: ReportTarget;
  /** Defaults to the translated "Report". */
  label?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SafetyState, FormData>(
    submitReport,
    {},
  );
  useErrorToast(state.error);

  if (state.ok) {
    return <p className="text-xs text-emerald-600">{t("report.done")}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-rose-600"
      >
        <FlagIcon className="size-3.5" />
        {label ?? t("action.report")}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-2 space-y-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700"
    >
      {Object.entries(target).map(([name, value]) =>
        value ? (
          <input key={name} type="hidden" name={name} value={value} />
        ) : null,
      )}

      <label className="block text-xs font-medium">
        {t("report.why")}
        <select
          name="reason"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="" disabled>
            {t("report.choose")}
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
        placeholder={t("report.details")}
        className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-sm"
        >
          {pending ? t("report.sending") : t("report.send")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-secondary btn-sm"
        >
          {t("action.cancel")}
        </button>
      </div>
    </form>
  );
}
