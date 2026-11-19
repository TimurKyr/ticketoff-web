import { Link } from "react-router-dom";

import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { amountDue, isExpired, timeLeft, useHoldExpiry } from "@/features/checkout";
import { useEvent } from "@/features/events/api";
import type { OrderOut } from "@/lib/api/types";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/useNow";

import { useMyOrders } from "../api";

function OrderRow({ order, now }: { order: OrderOut; now: number }) {
  const { t, lang } = useI18n();
  const event = useEvent(order.event_id);
  const expired = isExpired(order, now);
  const holding = order.status === "pending" && !expired && Boolean(order.expires_at);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-300 p-4">
      <div>
        <p className="font-semibold">{event.data?.title ?? "…"}</p>
        <p className="text-sm text-gray-700">
          {event.data && `${formatDateTime(event.data.start_at, lang)} · `}
          {order.tickets.length > 0 && `${t("myTickets.tickets")}: ${order.tickets.length} · `}
          {order.total_kzt > 0 && `${formatKzt(amountDue(order), lang)} · `}
          <strong>{expired ? t("order.status.expired") : t(`order.status.${order.status}`)}</strong>
          {holding && ` · ${t("order.holdLeft")} ${timeLeft(order.expires_at!, now)}`}
        </p>
      </div>
      <Link to={`/orders/${order.id}`} className="text-sm font-medium underline">
        {holding ? t("myTickets.pay") : t("myTickets.open")}
      </Link>
    </li>
  );
}

export function MyTicketsPage() {
  const { t } = useI18n();
  const orders = useMyOrders();
  // Pending checkouts show a countdown; otherwise a slow tick is enough.
  const holding = orders.data?.some((order) => order.status === "pending") ?? false;
  const now = useNow(holding ? 1000 : 30_000);
  useHoldExpiry(orders.data);

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
            <OrderRow key={order.id} order={order} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}
