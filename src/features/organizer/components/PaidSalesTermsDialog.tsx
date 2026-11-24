import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { formatKzt } from "@/lib/format";
import { useI18n, type MessageKey } from "@/lib/i18n";

const TERMS: MessageKey[] = [
  "org.terms.responsibility",
  "org.terms.fee",
  "org.terms.commission",
  "org.terms.refunds",
  "org.terms.cancel",
  "org.terms.suspension",
];

/**
 * The paid sales terms, read before accepting them (FE-22 #7): "Принять условия" used to
 * accept a text the organizer never saw.
 */
export function PaidSalesTermsDialog({
  feeKzt,
  pending,
  onAccept,
  onClose,
}: {
  feeKzt: number;
  pending: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const [read, setRead] = useState(false);
  return (
    <Dialog title={t("org.terms.title")} onClose={() => !pending && onClose()} className="max-w-lg">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-800">
        {TERMS.map((key) => (
          <li key={key}>{t(key).replace("{fee}", formatKzt(feeKzt, lang))}</li>
        ))}
      </ol>
      <p className="text-xs text-gray-600">{t("org.act.simulated")}</p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={read}
          onChange={(e) => setRead(e.target.checked)}
          className="mt-0.5 h-4 w-4"
          data-autofocus
        />
        {t("org.terms.agree")}
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          {t("org.terms.close")}
        </Button>
        <Button onClick={onAccept} disabled={!read || pending}>
          {pending ? t("common.loading") : t("org.act.doTerms")}
        </Button>
      </div>
    </Dialog>
  );
}

/** "Оплатить взнос" with the amount in front of the organizer before anything is charged. */
export function ActivationFeeDialog({
  feeKzt,
  pending,
  onPay,
  onClose,
}: {
  feeKzt: number;
  pending: boolean;
  onPay: () => void;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const fee = formatKzt(feeKzt, lang);
  return (
    <Dialog title={t("org.feeDialog.title")} onClose={() => !pending && onClose()}>
      <p className="text-2xl font-semibold tabular-nums">{fee}</p>
      <p className="text-sm text-gray-700">{t("org.feeDialog.text")}</p>
      <p className="text-xs text-gray-600">{t("org.act.simulated")}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={pending} data-autofocus>
          {t("org.terms.close")}
        </Button>
        <Button onClick={onPay} disabled={pending}>
          {pending ? t("common.loading") : `${t("org.feeDialog.pay")} ${fee}`}
        </Button>
      </div>
    </Dialog>
  );
}
