import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ErrorState, Loading } from "@/components/ui/States";
import { errorMessage } from "@/lib/api/errors";
import type { CodeOut, PromoCodeStatus } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { useCodes, useSetCodeStatus } from "../api";
import { AddCodeForm } from "./AddCodeForm";
import { PromoQrDialog } from "./PromoQrDialog";

const STATUS_CLASSES: Record<PromoCodeStatus, string> = {
  active: "bg-green-100 text-green-900",
  disabled: "bg-gray-200 text-gray-800",
  exhausted: "bg-amber-100 text-amber-900",
  expired: "bg-red-100 text-red-900",
};

export function CodeStatusBadge({ status }: { status: PromoCodeStatus }) {
  const { t } = useI18n();
  return (
    <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {t(`promo.code.status.${status}`)}
    </span>
  );
}

/** Codes of one campaign: status, usage, on/off switch, QR. */
export function CodesTable({
  eventId,
  campaignId,
  editable,
}: {
  eventId: string;
  campaignId: string;
  /** False on a closed event: only switching codes off is left. */
  editable: boolean;
}) {
  const { t } = useI18n();
  const codes = useCodes(eventId, campaignId);
  const setStatus = useSetCodeStatus(eventId, campaignId);
  const [error, setError] = useState<string | null>(null);
  const [qrFor, setQrFor] = useState<CodeOut | null>(null);

  async function toggle(code: CodeOut) {
    setError(null);
    try {
      await setStatus.mutateAsync({
        codeId: code.id,
        status: code.status === "disabled" ? "active" : "disabled",
      });
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    <div className="flex flex-col gap-2 pl-0 sm:pl-4">
      <h4 className="text-sm font-semibold text-gray-800">{t("promo.codes.title")}</h4>
      {error && <Alert tone="error">{error}</Alert>}
      {codes.isPending ? (
        <Loading />
      ) : codes.isError ? (
        <ErrorState error={codes.error} onRetry={() => codes.refetch()} />
      ) : codes.data.length === 0 ? (
        <p className="text-sm text-gray-700">{t("promo.codes.empty")}</p>
      ) : (
        // Scrolls sideways on a narrow screen instead of squeezing the columns. `relative`
        // keeps the absolutely positioned sr-only header inside it, else it widens the page.
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-gray-300 text-gray-700">
              <tr>
                <th scope="col" className="py-1 pr-3 font-medium">{t("promo.code.code")}</th>
                <th scope="col" className="py-1 pr-3 font-medium">{t("promo.code.status")}</th>
                <th scope="col" className="py-1 pr-3 font-medium">{t("promo.code.redeemableNow")}</th>
                <th scope="col" className="py-1 pr-3 text-right font-medium">
                  <abbr title={t("promo.code.redemptionsHint")} className="no-underline">
                    {t("promo.code.redemptions")}
                  </abbr>
                </th>
                <th scope="col" className="py-1 font-medium">
                  <span className="sr-only">{t("promo.code.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.data.map((code) => {
                const busy = setStatus.isPending && setStatus.variables?.codeId === code.id;
                const disabled = code.status === "disabled";
                return (
                  <tr key={code.id} className="border-b border-gray-200 last:border-0">
                    <th scope="row" className="py-2 pr-3 font-mono font-semibold">{code.code}</th>
                    <td className="py-2 pr-3">
                      <CodeStatusBadge status={code.status} />
                    </td>
                    <td className="py-2 pr-3">
                      {code.redeemable_now
                        ? t("promo.code.yes")
                        : code.status === "active"
                          ? t("promo.code.notStarted")
                          : t("promo.code.no")}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{code.redemptions}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="whitespace-nowrap"
                          aria-haspopup="dialog"
                          aria-label={`${t("promo.code.showQr")} ${code.code}`}
                          onClick={() => setQrFor(code)}
                        >
                          {t("promo.code.showQr")}
                        </Button>
                        {/* Switching off is always allowed; back on only while the event is open. */}
                        {(!disabled || editable) && (
                          <Button
                            variant="ghost"
                            className="whitespace-nowrap"
                            disabled={busy}
                            aria-label={`${t(disabled ? "promo.code.enable" : "promo.code.disable")} ${code.code}`}
                            onClick={() => toggle(code)}
                          >
                            {busy ? t("common.loading") : t(disabled ? "promo.code.enable" : "promo.code.disable")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {editable && <AddCodeForm eventId={eventId} campaignId={campaignId} />}
      {qrFor && <PromoQrDialog eventId={eventId} code={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  );
}
