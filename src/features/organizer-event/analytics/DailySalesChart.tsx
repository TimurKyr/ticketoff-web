import { useId, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DailySalesOut } from "@/lib/api/types";
import { formatDay, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type Metric = "tickets_sold" | "sales_kzt";

/**
 * Sales per day (tickets or money). The bars are decoration for sighted users; the same
 * numbers are in a table for screen readers, so the chart itself is hidden from them.
 */
export function DailySalesChart({ days }: { days: DailySalesOut[] }) {
  const { t, lang } = useI18n();
  const titleId = useId();
  const hasMoney = days.some((d) => d.sales_kzt > 0);
  const [metric, setMetric] = useState<Metric>(hasMoney ? "sales_kzt" : "tickets_sold");
  const shown: Metric = hasMoney ? metric : "tickets_sold";
  const data = days.map((d) => ({ ...d, label: formatDay(d.day, lang) }));
  const value = (n: number) => (shown === "sales_kzt" ? formatKzt(n, lang) : String(n));

  return (
    <figure aria-labelledby={titleId} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption id={titleId} className="font-semibold">
          {t("orgEvent.analytics.dailyTitle")}
        </figcaption>
        {hasMoney && (
          <div role="group" aria-label={t("orgEvent.analytics.metric")} className="flex gap-1 text-sm">
            {(["sales_kzt", "tickets_sold"] as Metric[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={shown === m}
                onClick={() => setMetric(m)}
                className={`rounded-md px-2 py-1 ${shown === m ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                {t(m === "sales_kzt" ? "orgEvent.analytics.metricMoney" : "orgEvent.analytics.metricTickets")}
              </button>
            ))}
          </div>
        )}
      </div>
      <div aria-hidden="true" className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" minTickGap={12} />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              width={shown === "sales_kzt" ? 72 : 32}
              tickFormatter={(n: number) => (shown === "sales_kzt" ? formatKzt(n, lang).replace("\u00a0₸", "") : String(n))}
            />
            <Tooltip
              formatter={(n) => [value(Number(n)), t(shown === "sales_kzt" ? "orgEvent.analytics.metricMoney" : "orgEvent.analytics.metricTickets")]}
              labelFormatter={(label) => String(label)}
            />
            <Bar dataKey={shown} fill="#2448C9" radius={[3, 3, 0, 0]} maxBarSize={48} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{t("orgEvent.analytics.dailyTitle")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("orgEvent.analytics.day")}</th>
            <th scope="col">{t("orgEvent.analytics.orders")}</th>
            <th scope="col">{t("orgEvent.analytics.metricTickets")}</th>
            <th scope="col">{t("orgEvent.analytics.metricMoney")}</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <th scope="row">{formatDay(d.day, lang)}</th>
              <td>{d.orders}</td>
              <td>{d.tickets_sold}</td>
              <td>{formatKzt(d.sales_kzt, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
