import { ReactNode, useMemo, useState } from "react";

import { FormField, SelectField } from "@/components/ui/FormField";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import type { CampaignStatsOut, TicketTypeStatsOut } from "@/lib/api/types";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useCheckinStats, useEventAnalytics } from "../api";
import { Percent, SimulationBadge, StatCard, StatGrid } from "../components/Stats";
import { DailySalesChart } from "./DailySalesChart";
import { fillDays } from "./days";

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
                {c.discount_type === "percent" ? `−${c.discount_value}\u00a0%` : `−${formatKzt(c.discount_value, lang)}`}
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
 * types, campaigns, days) and GET /checkin/events/{id}/stats (attendance), as given.
 * The date and type filters only narrow what is shown: the API has no such parameters.
 */
export function AnalyticsTab({ eventId }: { eventId: string }) {
  const { t, lang } = useI18n();
  const analytics = useEventAnalytics(eventId);
  const stats = useCheckinStats(eventId);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeId, setTypeId] = useState("");

  const days = useMemo(() => {
    const all = analytics.data?.daily_sales ?? [];
    // "YYYY-MM-DD" strings compare as dates.
    return fillDays(all.filter((d) => (!from || d.day >= from) && (!to || d.day <= to)));
  }, [analytics.data, from, to]);

  if (analytics.isPending) return <Loading />;
  if (analytics.isError) return <ErrorState error={analytics.error} onRetry={() => analytics.refetch()} />;

  const { event, ticket_types, campaigns, daily_sales, fee_percent } = analytics.data;
  const types = typeId ? ticket_types.filter((tt) => tt.ticket_type_id === typeId) : ticket_types;
  const firstDay = daily_sales[0]?.day ?? "";
  const lastDay = daily_sales[daily_sales.length - 1]?.day ?? "";

  return (
    <div className="flex flex-col gap-6">
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
          <StatCard label={`${t("orgEvent.money.fees")} (${fee_percent}\u00a0%)`} value={formatKzt(event.fees_kzt, lang)} />
          <StatCard label={t("orgEvent.money.refunds")} value={formatKzt(event.refunds_kzt, lang)} />
          <StatCard label={t("orgEvent.money.payout")} value={formatKzt(event.estimated_payout_kzt, lang)} />
        </StatGrid>
      </section>

      <section aria-labelledby="attendance-title" className="flex flex-col gap-3">
        <h2 id="attendance-title" className="text-lg font-semibold">{t("orgEvent.analytics.attendance")}</h2>
        {stats.isPending ? (
          <Loading />
        ) : stats.isError ? (
          <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
        ) : (
          <StatGrid>
            <StatCard label={t("orgEvent.analytics.registered")} value={stats.data.registered} />
            <StatCard label={t("orgEvent.analytics.checkedIn")} value={stats.data.checked_in} />
            <StatCard label={t("orgEvent.analytics.absent")} value={stats.data.absent} />
            <StatCard label={t("orgEvent.analytics.attendancePercent")} value={<Percent value={stats.data.percent} />} />
          </StatGrid>
        )}
      </section>

      <section aria-labelledby="dynamics-title" className="flex flex-col gap-3">
        <h2 id="dynamics-title" className="text-lg font-semibold">{t("orgEvent.analytics.dynamics")}</h2>
        {daily_sales.length === 0 ? (
          <EmptyState>{t("orgEvent.analytics.noSales")}</EmptyState>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
              <FormField label={t("orgEvent.analytics.from")} type="date" min={firstDay} max={lastDay} value={from} onChange={(e) => setFrom(e.target.value)} />
              <FormField label={t("orgEvent.analytics.to")} type="date" min={firstDay} max={lastDay} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <p className="text-xs text-gray-600">{t("orgEvent.analytics.daysHint").replace("$1", analytics.data.timezone)}</p>
            {days.length === 0 ? (
              <EmptyState>{t("orgEvent.analytics.noSalesInRange")}</EmptyState>
            ) : (
              <DailySalesChart days={days} />
            )}
          </>
        )}
      </section>

      <section aria-labelledby="types-title" className="flex flex-col gap-3">
        <h2 id="types-title" className="text-lg font-semibold">{t("orgEvent.analytics.byType")}</h2>
        {ticket_types.length === 0 ? (
          <EmptyState>{t("orgEvent.analytics.noTypes")}</EmptyState>
        ) : (
          <>
            {ticket_types.length > 1 && (
              <div className="sm:w-72">
                <SelectField label={t("orgEvent.analytics.typeFilter")} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                  <option value="">{t("orgEvent.analytics.allTypes")}</option>
                  {ticket_types.map((tt) => (
                    <option key={tt.ticket_type_id} value={tt.ticket_type_id}>
                      {tt.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            )}
            <TicketTypesTable types={types} />
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
