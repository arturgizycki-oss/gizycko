/**
 * A section that folds away. Built on <details> so it needs no client-side
 * JavaScript and keeps native keyboard and screen-reader behaviour.
 */
export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  hint,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-neutral-50 [&::-webkit-details-marker]:hidden dark:hover:bg-neutral-800">
        <span className="text-sm font-medium">{title}</span>

        <span
          className={
            count > 0
              ? "rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
              : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500 dark:bg-neutral-800"
          }
        >
          {count}
        </span>

        {hint && (
          <span className="hidden text-xs text-neutral-500 sm:inline">{hint}</span>
        )}

        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="ml-auto size-4 shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        {children}
      </div>
    </details>
  );
}
