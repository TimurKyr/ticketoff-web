import type { AdminPaymentOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { useFormat } from "../hooks/useFormat";
import { StatusBadge } from "./StatusBadge";

const shortId = (id: string | null) => (id ? id.slice(0, 8) : "—");

/** Read-only table of payments (used by failed payments and activations). */
export function PaymentsTable({ items }: { items: AdminPaymentOut[] }) {
  const { t } = useI18n();
  const { money, date } = useFormat();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-gray-600">
          <tr>
            <th className="py-2 pr-4">{t("admin.col.date")}</th>
            <th className="py-2 pr-4">{t("admin.col.amount")}</th>
            <th className="py-2 pr-4">{t("admin.col.status")}</th>
            <th className="py-2 pr-4">{t("admin.col.order")}</th>
            <th className="py-2 pr-4">{t("admin.col.event")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2 pr-4">{date(p.created_at)}</td>
              <td className="py-2 pr-4">
                {money(p.amount_kzt)}
                {p.is_simulated && <span className="ml-2 text-xs text-gray-500">{t("admin.simulated")}</span>}
              </td>
              <td className="py-2 pr-4">
                <StatusBadge status={p.status} />
              </td>
              <td className="py-2 pr-4 font-mono text-xs">{shortId(p.order_id)}</td>
              <td className="py-2 pr-4 font-mono text-xs">{shortId(p.event_id)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
