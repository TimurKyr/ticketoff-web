import { formatDateTime, formatKzt } from "@/lib/format";
import type { AdminPaymentOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { eventTitleOf } from "../eventTitle";
import { EventCell } from "./EventCell";
import { StatusBadge } from "./StatusBadge";

const shortId = (id: string | null) => (id ? id.slice(0, 8) : "—");

/** Read-only table of payments (used by failed payments and activations). */
export function PaymentsTable({ items }: { items: AdminPaymentOut[] }) {
  const { t, lang } = useI18n();

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
              <td className="py-2 pr-4">{formatDateTime(p.created_at, lang)}</td>
              <td className="py-2 pr-4">
                {formatKzt(p.amount_kzt, lang)}
                {p.is_simulated && <span className="ml-2 text-xs text-gray-500">{t("admin.simulated")}</span>}
              </td>
              <td className="py-2 pr-4">
                <StatusBadge status={p.status} />
              </td>
              <td className="py-2 pr-4 font-mono text-xs">{shortId(p.order_id)}</td>
              <td className="py-2 pr-4">
                {/* Title, not the UUID (FE-22 #16). */}
                <EventCell id={p.event_id} title={eventTitleOf(p)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}