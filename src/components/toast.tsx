"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useT } from "@/lib/i18n/provider";

type Tone = "error" | "info";
type Toast = { id: number; text: string; tone: Tone };

/** How long a message stays up before it fades on its own. */
const LIFETIME_MS = 6000;

const ToastContext = createContext<{
  show: (text: string, tone?: Tone) => void;
} | null>(null);

/**
 * Transient messages, shown over the page rather than inside the control that
 * produced them.
 *
 * A refused camera permission used to render next to the attachment buttons,
 * which pushed the message box sideways and left the reader with a squeezed
 * composer. Something that is neither part of the layout nor worth keeping
 * belongs on top of it.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((text: string, tone: Tone = "error") => {
    const id = (nextId.current += 1);
    setToasts((current) => [...current.slice(-2), { id, text, tone }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toasts.length > 0 && (
        <div
          // Announced to a screen reader without stealing focus.
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3"
        >
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const t = useT();

  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.id), LIFETIME_MS);
    return () => clearTimeout(id);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`card pointer-events-auto flex w-full max-w-sm items-start gap-3 px-4 py-3 text-sm shadow-lg ${
        toast.tone === "error"
          ? "border-rose-300 text-rose-700 dark:border-rose-900 dark:text-rose-300"
          : ""
      }`}
    >
      <span className="min-w-0 flex-1">{toast.text}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={t("action.close")}
        className="muted shrink-0 leading-none hover:text-[var(--ink)]"
      >
        x
      </button>
    </div>
  );
}

/**
 * `const toast = useToast()` then `toast("Camera permission refused.")`.
 *
 * Outside a provider this is a no-op rather than a crash, so a component can
 * be rendered in a test without one.
 */
export function useToast() {
  const context = useContext(ToastContext);
  return useCallback(
    (text: string, tone: Tone = "error") => context?.show(text, tone),
    [context],
  );
}
