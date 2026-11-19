import { useState } from "react";

import { useI18n } from "@/lib/i18n";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** Show the optional "reason" field (e.g. when suspending). */
  askReason?: boolean;
  isPending?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

/** Confirmation for destructive admin actions (suspend / resume). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  askReason = false,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-700">{description}</p>
        {askReason && (
          <textarea
            className="mt-4 w-full rounded border p-2 text-sm"
            placeholder={t("admin.confirm.reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
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
            onClick={() => onConfirm(askReason && reason ? reason : undefined)}
            disabled={isPending}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
