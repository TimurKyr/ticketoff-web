import { useState } from "react";

import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { PAGE_SIZE } from "../config";
import { useAdminRefunds } from "../hooks/useAdminQueries";
import { ListState } from "./ListState";
import { Pager } from "./Pager";
import { eventTitleOf } from "../eventTitle";
import { EventCell } from "./EventCell";
import { StatusBadge } from "./StatusBadge";

const shortId = (id: string | null) => (id ? id.slice(0, 8) : "—");

export function RefundsTab() {
  const { t, lang } = useI18n();
  const [offset, setOffset] = useState(0);
  const query = useAdminRefunds(PAGE_SIZE, offset);
  const data = query.data;

  return (
    <ListState
      isLoading={query.isFetching && !data}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={!!data && data.items.length === 0}
    >
      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="py-2 pr-4">{t("admin.col.date")}</th>
                  <th className="py-2 pr-4">{t("admin.col.amount")}</th>
                  <th className="py-2 pr-4">{t("admin.col.status")}</th>
                  <th className="py-2 pr-4">{t("admin.col.reason")}</th>
                  <th className="py-2 pr-4">{t("admin.col.order")}</th>
                  <th className="py-2 pr-4">{t("admin.col.event")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-4">{formatDateTime(r.created_at, lang)}</td>
                    <td className="py-2 pr-4">{formatKzt(r.amount_kzt, lang)}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2 pr-4">{r.reason ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{shortId(r.order_id)}</td>
                    <td className="py-2 pr-4">
                {/* Title, not the UUID (FE-22 #16). */}
                <EventCell id={r.event_id} title={eventTitleOf(r)} />
              </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager total={data.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
        </>
      )}
    </ListState>
  );
}