import { useState } from "react";

import { FormField } from "@/components/ui/FormField";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { PAGE_SIZE } from "../config";
import { usePromoActivity } from "../hooks/useAdminQueries";
import { EventCell } from "./EventCell";
import { ListState } from "./ListState";
import { Pager } from "./Pager";

/** «Промо» (R-128): promo code activity across the platform, biggest discount first. */
export function PromoActivityTab() {
  const { t, lang } = useI18n();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [offset, setOffset] = useState(0);
  const badRange = !!fromDate && !!toDate && fromDate > toDate;
  // A reversed period is not sent (the API answers 422): the last good page stays.
  const [period, setPeriod] = useState({ fromDate: "", toDate: "" });
  const query = usePromoActivity(period.fromDate, period.toDate, PAGE_SIZE, offset);
  const data = query.data;

  function change(nextFrom: string, nextTo: string) {
    setFromDate(nextFrom);
    setToDate(nextTo);
    if (!(nextFrom && nextTo && nextFrom > nextTo)) {
      setPeriod({ fromDate: nextFrom, toDate: nextTo });
      setOffset(0);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <FormField
          label={t("admin.period.from")}
          type="date"
          value={fromDate}
          onChange={(e) => change(e.target.value, toDate)}
        />
        <FormField
          label={t("admin.period.to")}
          type="date"
          value={toDate}
          onChange={(e) => change(fromDate, e.target.value)}
          error={badRange ? t("admin.period.invalid") : undefined}
        />
      </div>

      <ListState
        isLoading={query.isFetching && !data}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!!data && data.items.length === 0}
        emptyText={t("admin.promo.empty")}
      >
        {data && (
          <div className={query.isPlaceholderData ? "opacity-50" : undefined} aria-busy={query.isPlaceholderData}>
            <dl className="mb-4 flex flex-wrap gap-6 text-sm">
              <div>
                <dt className="text-gray-600">{t("admin.promo.totalRedemptions")}</dt>
                <dd className="text-lg font-semibold">{data.total_redemptions}</dd>
              </div>
              <div>
                <dt className="text-gray-600">{t("admin.promo.totalDiscount")}</dt>
                <dd className="text-lg font-semibold">{formatKzt(data.total_discount_kzt, lang)}</dd>
              </div>
            </dl>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-gray-600">
                  <tr>
                    <th className="py-2 pr-4">{t("admin.col.event")}</th>
                    <th className="py-2 pr-4">{t("admin.promo.campaign")}</th>
                    <th className="py-2 pr-4 text-right">{t("admin.promo.codes")}</th>
                    <th className="py-2 pr-4 text-right">{t("admin.promo.redemptions")}</th>
                    <th className="py-2 pr-4 text-right">{t("admin.promo.discount")}</th>
                    <th className="py-2 pr-4 text-right">{t("admin.promo.gross")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr key={row.campaign_id} className="border-b">
                      <td className="py-2 pr-4">
                        <EventCell id={row.event_id} title={row.event_title} />
                      </td>
                      <td className="py-2 pr-4">{row.campaign_name}</td>
                      <td className="py-2 pr-4 text-right">{row.codes}</td>
                      <td className="py-2 pr-4 text-right">{row.redemptions}</td>
                      <td className="py-2 pr-4 text-right">{formatKzt(row.discount_total_kzt, lang)}</td>
                      <td className="py-2 pr-4 text-right">{formatKzt(row.gross_kzt, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={data.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
          </div>
        )}
      </ListState>
    </section>
  );
}
