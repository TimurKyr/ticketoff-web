import { useState } from "react";

import { useI18n } from "@/lib/i18n";

import { PAGE_SIZE } from "../config";
import { useAdminRefunds } from "../hooks/useAdminQueries";
import { useFormat } from "../hooks/useFormat";
import { ListState } from "./ListState";
import { Pager } from "./Pager";
import { StatusBadge } from "./StatusBadge";

const shortId = (id: string | null) => (id ? id.slice(0, 8) : "—");

export function RefundsTab() {
  const { t } = useI18n();
  const { money, date } = useFormat();
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
                    <td className="py-2 pr-4">{date(r.created_at)}</td>
                    <td className="py-2 pr-4">{money(r.amount_kzt)}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2 pr-4">{r.reason ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{shortId(r.order_id)}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{shortId(r.event_id)}</td>
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
