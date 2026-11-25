import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useI18n } from "@/lib/i18n";

/**
 * The optional reason for buyers: `POST /events/{id}/cancel` takes `{"reason"}` since BE-37
 * (up to 500 characters, blank = none). An API from before BE-37 declares no body and ignores
 * it, so cancelling still works there, only without the reason in the email.
 */
export const CANCEL_REASON_ENABLED = true;
export const CANCEL_REASON_MAX = 500;

/**
 * "Отменить событие?" (FE-22 #11, instead of window.confirm): what happens to the orders,
 * and, when the API takes one, a reason for the buyers' notice.
 */
export function CancelEventDialog({
  title,
  pending,
  onConfirm,
  onClose,
}: {
  title: string;
  pending: boolean;
  onConfirm: (reason: string | null) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const length = reason.trim().length;
  const tooLong = length > CANCEL_REASON_MAX;

  return (
    <Dialog title={t("org.cancelDialog.title")} onClose={() => !pending && onClose()}>
      <p className="text-sm font-medium">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>{t("org.cancelDialog.paid")}</li>
        <li>{t("org.cancelDialog.free")}</li>
        <li>{t("org.cancelDialog.notify")}</li>
        <li>{t("org.cancelDialog.final")}</li>
      </ul>
      {CANCEL_REASON_ENABLED && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("org.cancelDialog.reason")}</span>
          <textarea
            value={reason}
            maxLength={CANCEL_REASON_MAX}
            rows={3}
            aria-invalid={tooLong || undefined}
            aria-describedby="cancel-reason-hint"
            onChange={(e) => setReason(e.target.value)}
            className="rounded-md border border-gray-400 px-3 py-2"
          />
          <span id="cancel-reason-hint" className="flex justify-between gap-3 text-xs text-gray-600">
            <span className={tooLong ? "text-red-700" : undefined}>
              {tooLong
                ? t("org.cancelDialog.reasonTooLong").replace("$1", String(CANCEL_REASON_MAX))
                : t("org.cancelDialog.reasonHint")}
            </span>
            <span className="tabular-nums">
              {t("org.cancelDialog.reasonCount")
                .replace("$1", String(length))
                .replace("$2", String(CANCEL_REASON_MAX))}
            </span>
          </span>
        </label>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={pending} data-autofocus>
          {t("org.cancelDialog.keep")}
        </Button>
        <Button variant="danger" onClick={() => onConfirm(reason.trim() || null)} disabled={pending || tooLong}>
          {pending ? t("common.loading") : t("org.cancelDialog.confirm")}
        </Button>
      </div>
    </Dialog>
  );
}
