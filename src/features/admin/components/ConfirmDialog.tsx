import { useEffect, useRef } from "react";

import { useI18n } from "@/lib/i18n";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  /** Already-translated error from the last attempt (e.g. 409/404). */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation for admin actions (suspend / unsuspend). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog on open, give it back on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [open]);

  // Escape closes (not while a request is running).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isPending, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p id="confirm-desc" className="mt-2 text-sm text-gray-700">
          {description}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="rounded border px-3 py-1.5 text-sm"
            onClick={onCancel}
            disabled={isPending}
          >
            {t("admin.confirm.cancel")}
          </button>
          <button
            type="button"
            className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={isPending}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
