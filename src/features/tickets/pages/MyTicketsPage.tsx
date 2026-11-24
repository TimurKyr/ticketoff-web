import { Link, useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { amountDue, holdState, timeLeft, useHoldExpiry } from "@/features/checkout";
import { useEvent, useEventsById } from "@/features/events/api";
import type { OrderOut } from "@/lib/api/types";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/useNow";

import { useMyOrders } from "../api";
import { groupOrders, type OrderTab } from "../orderGroups";

const TABS: OrderTab[] = ["upcoming", "past"];

function OrderRow({ order, now }: { order: OrderOut; now: number }) {
  const { t, lang } = useI18n();
  const event = useEvent(order.event_id);
  const hold = holdState(order, now);
  const expired = hold === "expired";
  const holding = hold === "active" || hold === "ending";
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-300 p-4">
      <div>
        <p className="font-semibold">{event.data?.title ?? "…"}</p>
        <p className="text-sm text-gray-700">
          {event.data && `${formatDateTime(event.data.start_at, lang)} · `}
          {order.tickets.length > 0 && `${t("myTickets.tickets")}: ${order.tickets.length} · `}
          {order.total_kzt > 0 && `${formatKzt(amountDue(order), lang)} · `}
          <strong>{expired ? t("order.status.expired") : t(`order.status.${order.status}`)}</strong>
          {hold === "active" && ` · ${t("order.holdLeft")} ${timeLeft(order.expires_at!, now)}`}
          {hold === "ending" && ` · ${t("order.holdEndingShort")}`}
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
  const [params, setParams] = useSearchParams();
  const tab: OrderTab = params.get("tab") === "past" ? "past" : "upcoming";
  const events = useEventsById(orders.data?.map((order) => order.event_id) ?? []);
  const groups = groupOrders(orders.data ?? [], events, now);
  const shown = groups[tab];

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
        <>
          <nav aria-label={t("myTickets.title")} className="flex gap-2 border-b border-[#E4E1DA]">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                aria-current={id === tab ? "page" : undefined}
                onClick={() => setParams(id === "upcoming" ? {} : { tab: id }, { replace: true })}
                className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                  id === tab ? "border-[#1A1A18] font-semibold" : "border-transparent text-gray-700 hover:text-black"
                }`}
              >
                {t(`myTickets.tab.${id}`)} <span className="text-gray-500">{groups[id].length}</span>
              </button>
            ))}
          </nav>
          {shown.length === 0 ? (
            <EmptyState>
              <p className="mb-2">{t(`myTickets.tab.${tab}Empty`)}</p>
              {tab === "upcoming" && (
                <Link to="/events" className="underline">
                  {t("myTickets.toEvents")}
                </Link>
              )}
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((order) => (
                <OrderRow key={order.id} order={order} now={now} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
