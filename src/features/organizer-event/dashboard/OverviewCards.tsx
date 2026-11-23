import { ErrorState, Loading } from "@/components/ui/States";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useOrganizerOverview } from "../api";
import { Percent, SimulationBadge, StatCard, StatGrid } from "../components/Stats";

/** Dashboard summary: my events by bucket and the totals over all of them (BE-21). */
export function OverviewCards() {
  const { t, lang } = useI18n();
  const overview = useOrganizerOverview();

  if (overview.isPending) return <Loading />;
  if (overview.isError) return <ErrorState error={overview.error} onRetry={() => overview.refetch()} />;
  const { events, totals, fee_percent } = overview.data;

  return (
    <section aria-labelledby="overview-title" className="flex flex-col gap-4 rounded-lg border border-gray-300 p-4">
      <h2 id="overview-title" className="text-xl font-semibold">{t("dashboard.overview")}</h2>
      <StatGrid label={t("dashboard.events")}>
        <StatCard label={t("dashboard.eventsTotal")} value={events.total} hint={events.draft ? `${t("dashboard.drafts")}: ${events.draft}` : undefined} />
        <StatCard label={t("org.bucket.upcoming")} value={events.upcoming} />
        <StatCard label={t("org.bucket.active")} value={events.active} />
        <StatCard label={t("org.bucket.completed")} value={events.completed} />
        <StatCard label={t("org.bucket.cancelled")} value={events.cancelled} />
      </StatGrid>
      <h3 className="flex flex-wrap items-center gap-2 font-semibold">
        {t("dashboard.totals")} <SimulationBadge />
      </h3>
      <StatGrid label={t("dashboard.totals")}>
        <StatCard label={t("orgEvent.analytics.sold")} value={totals.tickets_sold} hint={`${t("orgEvent.analytics.orders")}: ${totals.orders}`} />
        <StatCard label={t("orgEvent.money.gross")} value={formatKzt(totals.gross_kzt, lang)} />
        <StatCard label={t("orgEvent.money.discounts")} value={formatKzt(totals.discounts_kzt, lang)} />
        <StatCard label={`${t("orgEvent.money.fees")} (${fee_percent}\u00a0%)`} value={formatKzt(totals.fees_kzt, lang)} />
        <StatCard label={t("orgEvent.money.refunds")} value={formatKzt(totals.refunds_kzt, lang)} />
        <StatCard label={t("orgEvent.money.payout")} value={formatKzt(totals.estimated_payout_kzt, lang)} />
        <StatCard
          label={t("orgEvent.analytics.attendancePercent")}
          value={<Percent value={totals.check_in_percent} />}
          hint={`${totals.checked_in} / ${totals.tickets_sold}`}
        />
      </StatGrid>
    </section>
  );
}
