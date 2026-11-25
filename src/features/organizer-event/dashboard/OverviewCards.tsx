import { useState } from "react";

import { FormField } from "@/components/ui/FormField";
import { ErrorState, Loading } from "@/components/ui/States";
import { formatKzt, formatPercent } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useOrganizerOverview } from "../api";
import { isReversed, NO_FILTERS, type AnalyticsFilters } from "../analytics/filters";
import { Percent, SimulationBadge, StatCard, StatGrid } from "../components/Stats";

/** Dashboard summary: my events by bucket and the totals over all of them (BE-21). */
export function OverviewCards() {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<AnalyticsFilters>(NO_FILTERS);
  // A period narrows the totals on the server (R-118); a reversed one is not sent.
  const [period, setPeriod] = useState<AnalyticsFilters>(NO_FILTERS);
  const overview = useOrganizerOverview(period);

  function change(patch: Partial<AnalyticsFilters>) {
    const next = { ...form, ...patch };
    setForm(next);
    if (!isReversed(next)) setPeriod(next);
  }

  if (overview.isPending) return <Loading />;
  if (overview.isError) return <ErrorState error={overview.error} onRetry={() => overview.refetch()} />;
  const { events, totals, fee_percent } = overview.data;

  return (
    <section
      aria-labelledby="overview-title"
      aria-busy={overview.isPlaceholderData}
      className="flex flex-col gap-4 rounded-lg border border-gray-300 p-4">
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
      <div className="grid gap-3 sm:max-w-md sm:grid-cols-2 [&>*]:min-w-0">
        <FormField label={t("orgEvent.analytics.from")} type="date" value={form.from_date} onChange={(e) => change({ from_date: e.target.value })} />
        <FormField
          label={t("orgEvent.analytics.to")}
          type="date"
          value={form.to_date}
          onChange={(e) => change({ to_date: e.target.value })}
          error={isReversed(form) ? t("admin.period.invalid") : undefined}
        />
      </div>
      <StatGrid label={t("dashboard.totals")}>
        <StatCard label={t("orgEvent.analytics.sold")} value={totals.tickets_sold} hint={`${t("orgEvent.analytics.orders")}: ${totals.orders}`} />
        <StatCard label={t("orgEvent.money.gross")} value={formatKzt(totals.gross_kzt, lang)} />
        <StatCard label={t("orgEvent.money.discounts")} value={formatKzt(totals.discounts_kzt, lang)} />
        <StatCard label={`${t("orgEvent.money.fees")} (${formatPercent(fee_percent, lang)})`} value={formatKzt(totals.fees_kzt, lang)} />
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
