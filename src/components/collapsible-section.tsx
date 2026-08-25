/**
 * A section that folds away. Built on <details> so it needs no client-side
 * JavaScript and keeps native keyboard and screen-reader behaviour.
 *
 * `count` is a tally of what is inside and sits after the title. `order` is a
 * position in a numbered list and sits before it, where a reader expects a
 * number to be. Pass one or the other, not both.
 */
export function CollapsibleSection({
  title,
  count,
  order,
  defaultOpen = false,
  hint,
  children,
}: {
  title: string;
  count?: number;
  order?: number;
  defaultOpen?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-[var(--surface-muted)] [&::-webkit-details-marker]:hidden">
        {order !== undefined && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            {order}
          </span>
        )}

        <span className="text-sm font-medium">{title}</span>

        {count !== undefined && (
          <span
            className={
              count > 0
                ? "rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                : "rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--ink-muted)]"
            }
          >
            {count}
          </span>
        )}

        {hint && <span className="hint hidden sm:inline">{hint}</span>}

        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="ml-auto size-4 shrink-0 text-[var(--ink-muted)] transition-transform duration-200 group-open:rotate-180"
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <div className="border-t border-[var(--line)] p-3">{children}</div>
    </details>
  );
}
