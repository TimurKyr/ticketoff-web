import { ErrorState, Loading } from "@/components/ui/States";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { useInventory } from "../api";

const COLUMNS: [key: "sold" | "reserved" | "available" | "checked_in" | "refunded" | "cancelled", label: MessageKey][] = [
  ["sold", "org.inv.sold"],
  ["reserved", "org.inv.reserved"],
  ["available", "org.inv.available"],
  ["checked_in", "org.inv.checkedIn"],
  ["refunded", "org.inv.refunded"],
  ["cancelled", "org.inv.cancelled"],
];

/** GET /events/{id}/inventory: totals and per ticket type. */
export function InventorySection({ eventId }: { eventId: string }) {
  const { t } = useI18n();
  const inventory = useInventory(eventId);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <h2 className="text-xl font-semibold">{t("org.inv.title")}</h2>
      {inventory.isPending ? (
        <Loading />
      ) : inventory.isError ? (
        <ErrorState error={inventory.error} onRetry={() => inventory.refetch()} />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md bg-gray-50 p-3">
              <dt className="text-xs text-gray-600">{t("org.inv.capacity")}</dt>
              <dd className="text-xl font-semibold">{inventory.data.capacity ?? t("org.inv.noCapacity")}</dd>
            </div>
            {COLUMNS.slice(0, 4).map(([key, label]) => (
              <div key={key} className="rounded-md bg-gray-50 p-3">
                <dt className="text-xs text-gray-600">{t(label)}</dt>
                <dd className="text-xl font-semibold">{inventory.data[key]}</dd>
              </div>
            ))}
          </dl>
          {inventory.data.ticket_types.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th scope="col" className="py-2 pr-3">{t("org.inv.type")}</th>
                    {COLUMNS.map(([key, label]) => (
                      <th key={key} scope="col" className="py-2 pr-3 text-right">{t(label)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.data.ticket_types.map((row) => (
                    <tr key={row.ticket_type_id} className="border-b border-gray-200 last:border-0">
                      <th scope="row" className="py-2 pr-3 font-medium">
                        {row.name} <span className="font-normal text-gray-600">/ {row.quantity_total}</span>
                      </th>
                      {COLUMNS.map(([key]) => (
                        <td key={key} className="py-2 pr-3 text-right tabular-nums">{row[key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
