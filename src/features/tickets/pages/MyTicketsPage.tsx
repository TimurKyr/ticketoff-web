import { Link } from "react-router-dom";

import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { useEvent } from "@/features/events/api";
import type { OrderOut } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useMyOrders } from "../api";

function OrderRow({ order }: { order: OrderOut }) {
  const { t, lang } = useI18n();
  const event = useEvent(order.event_id);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-300 p-4">
      <div>
        <p className="font-semibold">{event.data?.title ?? "…"}</p>
        <p className="text-sm text-gray-700">
          {event.data && `${formatDateTime(event.data.start_at, lang)} · `}
          {t("myTickets.tickets")}: {order.tickets.length} · {t(`order.status.${order.status}`)}
        </p>
      </div>
      <Link to={`/orders/${order.id}`} className="text-sm font-medium underline">
        {t("myTickets.open")}
      </Link>
    </li>
  );
}

export function MyTicketsPage() {
  const { t } = useI18n();
  const orders = useMyOrders();

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("myTickets.title")}</h1>
      {orders.isPending ? (
        <Loading />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : orders.data.length === 0 ? (
        <EmptyState>
          <p className="mb-2">{t("myTickets.empty")}</p>
          <Link to="/events" className="underline">
            {t("myTickets.toEvents")}
          </Link>
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.data.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </section>
  );
}
