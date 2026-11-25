import { ReactNode, useEffect, useState } from "react";

import { FormField, SelectField } from "@/components/ui/FormField";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import type { CampaignStatsOut, TicketTypeStatsOut } from "@/lib/api/types";
import { formatKzt, formatPercent } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useCheckinStats, useEventAnalytics } from "../api";
import { Percent, SimulationBadge, StatCard, StatGrid } from "../components/Stats";
import { DailySalesChart } from "./DailySalesChart";
import { fillDays } from "./days";
import { isReversed, NO_FILTERS, type AnalyticsFilters } from "./filters";

/** A table that scrolls sideways inside its own box on a narrow screen. */
function ScrollTable({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    // `relative` keeps sr-only bits inside the scrolling box (else they widen the page).
    <div className="relative overflow-x-auto rounded-lg border border-gray-300">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

function TicketTypesTable({ types }: { types: TicketTypeStatsOut[] }) {
  const { t, lang } = useI18n();
  return (
    <ScrollTable caption={t("orgEvent.analytics.byType")}>
      <thead className="bg-gray-50 text-gray-700">
        <tr>
          <th scope="col" className="px-3 py-2 font-medium">{t("orgEvent.analytics.type")}</th>
          <th scope="col" className="px-3 py-2 font-medium">{t("orgEvent.analytics.price")}</th>
          <th scope="col" className="px-3 py-2 text-right font-medium">{t("orgEvent.analytics.soldOfTotal")}</th>
          <th scope="col" className="px-3 py-2 text-right font-medium">{t("orgEvent.analytics.typeSales")}</th>
        </tr>
      </thead>
      <tbody>
        {types.map((type) => (
          <tr key={type.ticket_type_id} className="border-t border-gray-200">
            <th scope="row" className="px-3 py-2 font-medium">
              {type.name}
              {type.is_hidden && <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-normal">{t("org.tt.hidden")}</span>}
            </th>
            <td className="px-3 py-2">{type.kind === "free" ? t("events.free") : formatKzt(type.price_kzt, lang)}</td>
            <td className="px-3 py-2 text-right tabular-nums">
              {type.sold} / {type.quantity_total}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{formatKzt(type.sales_kzt, lang)}</td>
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  );
}

function CampaignsTable({ campaigns }: { campaigns: CampaignStatsOut[] }) {
  const { t, lang } = useI18n();
  return (
    <ScrollTable caption={t("orgEvent.analytics.campaigns")}>
      <thead className="bg-gray-50 text-gray-700">
        <tr>
          <th scope="col" className="px-3 py-2 font-medium">{t("orgEvent.analytics.campaign")}</th>
          <th scope="col" className="px-3 py-2 text-right font-medium">{t("orgEvent.analytics.redemptions")}</th>
          <th scope="col" className="px-3 py-2 text-right font-medium">{t("orgEvent.analytics.orders")}</th>
          <th scope="col" className="px-3 py-2 text-right font-medium">{t("orgEvent.money.gross")}</th>
          <th scope="col" className="px-3 py-2 text-right font-medium">{t("orgEvent.money.discounts")}</th>
          <th scope="col" className="px-3 py-2 text-right font-medium">{t("orgEvent.analytics.net")}</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map((c) => (
          <tr key={c.campaign_id} className="border-t border-gray-200">
            <th scope="row" className="px-3 py-2 font-medium">
              {c.name}{" "}
              <span className="whitespace-nowrap text-xs font-normal text-gray-600">
                {c.discount_type === "percent" ? `−${formatPercent(c.discount_value, lang)}` : `−${formatKzt(c.discount_value, lang)}`}
              </span>
            </th>
            <td className="px-3 py-2 text-right tabular-nums">{c.redemptions}</td>
            <td className="px-3 py-2 text-right tabular-nums">{c.orders}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatKzt(c.gross_kzt, lang)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatKzt(c.discount_total_kzt, lang)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatKzt(c.net_kzt, lang)}</td>
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  );
}

/**
 * «Аналитика»: every number comes from GET /organizer/analytics/events/{id} (sales, money,
 * types, campaigns, days) and GET /checkin/events/{id}/stats (attendance), as given. The
 * period and ticket type are sent to the API (R-118), which narrows the figures; capacity,
 * remaining and percent sold stay all-time and are shown as the API gives them.
 */
export function AnalyticsTab({ eventId, startAt }: { eventId: string; startAt?: string }) {
  const { t, lang } = useI18n();
  // Nobody can be a no-show before the doors open (FE-22 #21).
  const started = !startAt || Date.parse(startAt) <= Date.now();
  const [form, setForm] = useState<AnalyticsFilters>(NO_FILTERS);
  // What was sent: a reversed period is not (the API answers 422), the last good figures stay.
  const [filters, setFilters] = useState<AnalyticsFilters>(NO_FILTERS);
  const analytics = useEventAnalytics(eventId, filters);
  const stats = useCheckinStats(eventId);
  // The type select lists every type of the event, also while one is chosen (then the
  // response has only that one).
  const [typeOptions, setTypeOptions] = useState<{ id: string; name: string }[]>([]);
  const unfiltered = !filters.ticket_type_id ? analytics.data : undefined;
  useEffect(() => {
    if (unfiltered && !analytics.isPlaceholderData) {
      setTypeOptions(unfiltered.ticket_types.map((tt) => ({ id: tt.ticket_type_id, name: tt.name })));
    }
  }, [unfiltered, analytics.isPlaceholderData]);

  function change(patch: Partial<AnalyticsFilters>) {
    const next = { ...form, ...patch };
    setForm(next);
    if (!isReversed(next)) setFilters(next);
  }

  if (analytics.isPending) return <Loading />;
  if (analytics.isError) return <ErrorState error={analytics.error} onRetry={() => analytics.refetch()} />;

  const { event, ticket_types, campaigns, daily_sales, fee_percent } = analytics.data;
  const days = fillDays(daily_sales);
  const filtered = Boolean(filters.from_date || filters.to_date || filters.ticket_type_id);

  return (
    <div
      className={`flex flex-col gap-6 transition-opacity ${analytics.isPlaceholderData ? "opacity-60" : ""}`}
      aria-busy={analytics.isPlaceholderData}
    >
      <section aria-labelledby="filters-title" className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
        <h2 id="filters-title" className="text-lg font-semibold">{t("orgEvent.analytics.filters")}</h2>
        <div className="grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
          <FormField label={t("orgEvent.analytics.from")} type="date" value={form.from_date} onChange={(e) => change({ from_date: e.target.value })} />
          <FormField
            label={t("orgEvent.analytics.to")}
            type="date"
            value={form.to_date}
            onChange={(e) => change({ to_date: e.target.value })}
            error={isReversed(form) ? t("admin.period.invalid") : undefined}
          />
          {typeOptions.length > 1 && (
            <SelectField label={t("orgEvent.analytics.typeFilter")} value={form.ticket_type_id ?? ""} onChange={(e) => change({ ticket_type_id: e.target.value })}>
              <option value="">{t("orgEvent.analytics.allTypes")}</option>
              {typeOptions.map((tt) => (
                <option key={tt.id} value={tt.id}>
                  {tt.name}
                </option>
              ))}
            </SelectField>
          )}
        </div>
        <p className="text-xs text-gray-600">{t("orgEvent.analytics.filtersHint")}</p>
      </section>

      <section aria-labelledby="sales-title" className="flex flex-col gap-3">
        <h2 id="sales-title" className="text-lg font-semibold">{t("orgEvent.analytics.sales")}</h2>
        <StatGrid>
          <StatCard
            label={t("orgEvent.analytics.capacity")}
            value={event.capacity ?? "—"}
            hint={`${t("orgEvent.analytics.ticketsTotal")}: ${event.tickets_total}`}
          />
          <StatCard label={t("orgEvent.analytics.sold")} value={`${event.tickets_sold} / ${event.tickets_total}`} />
          <StatCard label={t("orgEvent.analytics.percentSold")} value={<Percent value={event.percent_sold} />} />
          <StatCard label={t("orgEvent.analytics.remaining")} value={event.remaining} />
          <StatCard label={t("orgEvent.analytics.orders")} value={event.orders} />
        </StatGrid>
      </section>

      <section aria-labelledby="money-title" className="flex flex-col gap-3">
        <h2 id="money-title" className="flex flex-wrap items-center gap-2 text-lg font-semibold">
          {t("orgEvent.analytics.money")} <SimulationBadge />
        </h2>
        <StatGrid>
          <StatCard label={t("orgEvent.money.gross")} value={formatKzt(event.gross_kzt, lang)} hint={t("orgEvent.money.grossHint")} />
          <StatCard label={t("orgEvent.money.discounts")} value={formatKzt(event.discounts_kzt, lang)} />
          <StatCard label={`${t("orgEvent.money.fees")} (${formatPercent(fee_percent, lang)})`} value={formatKzt(event.fees_kzt, lang)} />
          <StatCard label={t("orgEvent.money.refunds")} value={formatKzt(event.refunds_kzt, lang)} />
          <StatCard label={t("orgEvent.money.payout")} value={formatKzt(event.estimated_payout_kzt, lang)} />
        </StatGrid>
      </section>

      <section aria-labelledby="attendance-title" className="flex flex-col gap-3">
        <h2 id="attendance-title" className="text-lg font-semibold">{t("orgEvent.analytics.attendance")}</h2>
        {filtered && <p className="text-xs text-gray-600">{t("orgEvent.analytics.attendanceAllTime")}</p>}
        {stats.isPending ? (
          <Loading />
        ) : stats.isError ? (
          <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
        ) : (
          <StatGrid>
            <StatCard label={t("orgEvent.analytics.registered")} value={stats.data.registered} />
            <StatCard label={t("orgEvent.analytics.checkedIn")} value={stats.data.checked_in} />
            <StatCard
              label={t("orgEvent.analytics.absent")}
              value={started ? stats.data.absent : "—"}
              hint={started ? undefined : t("orgEvent.analytics.absentLater")}
            />
            <StatCard label={t("orgEvent.analytics.attendancePercent")} value={<Percent value={stats.data.percent} />} />
          </StatGrid>
        )}
      </section>

      <section aria-labelledby="dynamics-title" className="flex flex-col gap-3">
        <h2 id="dynamics-title" className="text-lg font-semibold">{t("orgEvent.analytics.dynamics")}</h2>
        {days.length === 0 ? (
          <EmptyState>{t(filtered ? "orgEvent.analytics.noSalesInRange" : "orgEvent.analytics.noSales")}</EmptyState>
        ) : (
          <>
            <p className="text-xs text-gray-600">{t("orgEvent.analytics.daysHint").replace("$1", analytics.data.timezone)}</p>
            <DailySalesChart days={days} />
          </>
        )}
      </section>

      <section aria-labelledby="types-title" className="flex flex-col gap-3">
        <h2 id="types-title" className="text-lg font-semibold">{t("orgEvent.analytics.byType")}</h2>
        {ticket_types.length === 0 ? (
          <EmptyState>{t("orgEvent.analytics.noTypes")}</EmptyState>
        ) : (
          <>
            <TicketTypesTable types={ticket_types} />
            <p className="text-xs text-gray-600">{t("orgEvent.analytics.typeSalesHint")}</p>
          </>
        )}
      </section>

      <section aria-labelledby="campaigns-title" className="flex flex-col gap-3">
        <h2 id="campaigns-title" className="text-lg font-semibold">{t("orgEvent.analytics.campaigns")}</h2>
        {campaigns.length === 0 ? (
          <EmptyState>{t("orgEvent.analytics.noCampaigns")}</EmptyState>
        ) : (
          <CampaignsTable campaigns={campaigns} />
        )}
      </section>
    </div>
  );
}
