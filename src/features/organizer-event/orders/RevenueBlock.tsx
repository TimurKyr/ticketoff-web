import { ErrorState, Loading } from "@/components/ui/States";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { usePaymentSummary } from "../api";
import { SimulationBadge, StatCard, StatGrid } from "../components/Stats";

/** "Выручка (демо)" (R-51): the event's payment summary, every number as the API gives it. */
export function RevenueBlock({ eventId }: { eventId: string }) {
  const { t, lang } = useI18n();
  const summary = usePaymentSummary(eventId);

  return (
    <section aria-labelledby="revenue-title" className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <h2 id="revenue-title" className="flex flex-wrap items-center gap-2 text-lg font-semibold">
        {t("orgEvent.revenue.title")} <SimulationBadge />
      </h2>
      {summary.isPending ? (
        <Loading />
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
      ) : (
        <>
          <StatGrid>
            <StatCard label={t("orgEvent.money.gross")} value={formatKzt(summary.data.gross_kzt, lang)} />
            <StatCard
              label={`${t("orgEvent.money.fees")} (${summary.data.fee_percent}\u00a0%)`}
              value={formatKzt(summary.data.fees_kzt, lang)}
            />
            <StatCard label={t("orgEvent.money.refunds")} value={formatKzt(summary.data.refunds_kzt, lang)} />
            <StatCard
              label={t("orgEvent.money.payout")}
              value={formatKzt(summary.data.estimated_payout_kzt, lang)}
            />
          </StatGrid>
          <p className="text-xs text-gray-600">{t("orgEvent.revenue.note")}</p>
        </>
      )}
    </section>
  );
}
