import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api/client";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { downloadReport, REPORT_KINDS, type ReportKind } from "../download";
import { errorText } from "../errors";

const LABELS: Record<ReportKind, MessageKey> = {
  payments: "admin.exports.payments",
  refunds: "admin.exports.refunds",
  orders: "admin.exports.orders",
};

/** «Отчёты» (R-129): payments / refunds / orders as CSV for a period. */
export function ExportsTab() {
  const { t } = useI18n();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [busy, setBusy] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const badRange = !!fromDate && !!toDate && fromDate > toDate;

  async function download(kind: ReportKind) {
    setBusy(kind);
    setError(null);
    setDone(null);
    try {
      setDone(await downloadReport(kind, fromDate, toDate));
    } catch (err) {
      setError(err instanceof ApiError && err.status === 422 ? t("admin.period.invalid") : errorText(err, t));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <p className="text-sm text-gray-700">{t("admin.exports.intro")}</p>
      <div className="flex flex-wrap gap-3">
        <FormField
          label={t("admin.period.from")}
          type="date"
          value={fromDate}
          max={toDate || undefined}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <FormField
          label={t("admin.period.to")}
          type="date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) => setToDate(e.target.value)}
          error={badRange ? t("admin.period.invalid") : undefined}
        />
      </div>
      <p className="text-xs text-gray-600">{t("admin.exports.hint")}</p>
      <div className="flex flex-wrap gap-2">
        {REPORT_KINDS.map((kind) => (
          <Button
            key={kind}
            type="button"
            variant="secondary"
            disabled={badRange || busy !== null}
            onClick={() => void download(kind)}
          >
            <Download className="mr-1 inline h-4 w-4" aria-hidden />
            {busy === kind ? t("admin.exports.busy") : t(LABELS[kind])}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm text-green-700">
          {t("admin.exports.done").replace("$1", done)}
        </p>
      )}
    </section>
  );
}
