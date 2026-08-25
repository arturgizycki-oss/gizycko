/**
 * Report reasons live here rather than beside the server action, because a
 * "use server" module may only export async functions - exporting this array
 * from there is a runtime error in Next.js.
 */
export const REPORT_REASONS = [
  { value: "HARASSMENT", label: "Harassment or abuse" },
  { value: "NUDITY", label: "Nudity or sexual content" },
  { value: "FAKE_PROFILE", label: "Fake profile or impersonation" },
  { value: "UNDERAGE", label: "This person is under 18" },
  { value: "SCAM", label: "Scam or money request" },
  { value: "SPAM", label: "Spam" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "OTHER", label: "Something else" },
] as const;

export const REPORT_REASON_VALUES = REPORT_REASONS.map(
  (r) => r.value,
) as unknown as [ReportReasonValue, ...ReportReasonValue[]];

export type ReportReasonValue = (typeof REPORT_REASONS)[number]["value"];
