import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import {
  amountDue,
  CancelOrderButton,
  holdState,
  PaymentPanel,
  RefundPolicy,
  timeLeft,
  useHoldExpiry,
} from "@/features/checkout";
import { AddToCalendar } from "@/features/events/components/AddToCalendar";
import { useEvent, usePublicTicketTypes } from "@/features/events/api";
import { eventPath } from "@/features/events/paths";
import { HelpButton } from "@/features/support";
import { track } from "@/lib/analytics";
import { ApiError } from "@/lib/api/client";
import type { OrderOut } from "@/lib/api/types";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/useNow";

import { useOrder } from "../api";
import { TicketCard } from "../components/TicketCard";

/** Price lines and totals; every number is from the server. */
function OrderSummary({
  order,
  payable,
  typeName,
}: {
  order: OrderOut;
  payable: boolean;
  typeName: (id: string) => string | undefined;
}) {
  const { t, lang } = useI18n();
  const totalLabel = payable ? t("order.toPay") : order.status === "paid" ? t("order.paid") : t("order.total");
  if (order.total_kzt === 0) return null;
  return (
    <dl className="grid grid-cols-[1fr_max-content] gap-x-4 gap-y-1 rounded-md border border-gray-300 p-3 text-sm">
      {order.items.map((item) => (
        <div key={item.ticket_type_id} className="contents">
          <dt>
            {typeName(item.ticket_type_id) ?? t("ticket.title")} × {item.quantity}
          </dt>
          <dd className="text-right">{formatKzt(item.unit_price_kzt * item.quantity, lang)}</dd>
        </div>
      ))}
      {order.discount_kzt > 0 && (
        <>
          <dt>{t("order.discount")}</dt>
          <dd className="text-right">−{formatKzt(order.discount_kzt, lang)}</dd>
        </>
      )}
      <dt className="border-t border-gray-300 pt-1 font-semibold">{totalLabel}</dt>
      <dd className="border-t border-gray-300 pt-1 text-right font-semibold">
        {formatKzt(amountDue(order), lang)}
      </dd>
    </dl>
  );
}

/** Time left on the hold. Screen readers are told once, when the last minute starts. */
function HoldTimer({ expiresAt, now }: { expiresAt: string; now: number }) {
  const { t } = useI18n();
  const left = timeLeft(expiresAt, now);
  const lastMinute = Date.parse(expiresAt) - now <= 60_000;
  return (
    <p className={`text-sm ${lastMinute ? "font-semibold text-red-800" : "text-gray-800"}`}>
      {t("order.holdLeft")}{" "}
      <span role="timer" className="font-mono text-base">
        {left}
      </span>
      {lastMinute && (
        <span role="status" className="sr-only">
          {t("order.lastMinute")}
        </span>
      )}
    </p>
  );
}

/** One order of the current user: pay a pending checkout, or see the tickets (QR + PDF). */
export function OrderPage() {
  const { orderId = "" } = useParams();
  const { t } = useI18n();
  const justCreated = Boolean((useLocation().state as { justCreated?: boolean } | null)?.justCreated);
  const [paidNow, setPaidNow] = useState(false);
  // Why the last payment was refused; kept here since the panel goes away once the order is cancelled.
  const [payError, setPayError] = useState<string | null>(null);

  const order = useOrder(orderId);
  const eventId = order.data?.event_id ?? "";
  const event = useEvent(eventId);
  const ticketTypes = usePublicTicketTypes(eventId);
  // Every second only while a hold is running.
  const now = useNow(order.data?.status === "pending" ? 1000 : 30_000);
  useHoldExpiry(order.data ? [order.data] : undefined);

  if (order.isPending) return <Loading />;
  if (order.isError) {
    const status = order.error instanceof ApiError ? order.error.status : 0;
    return status === 404 || status === 422 ? (
      <EmptyState>{t("order.notFound")}</EmptyState>
    ) : (
      <ErrorState error={order.error} onRetry={() => order.refetch()} />
    );
  }

  const data = order.data;
  const typeName = (id: string) => ticketTypes.data?.find((type) => type.id === id)?.name;
  const hold = holdState(data, now);
  const expired = hold === "expired";
  // While the hold is "ending" payment stays open: the server has the final word.
  const payable = hold === "active" || hold === "ending";
  // The API refuses to cancel once the event has started or a ticket was used at the door.
  const started = event.data ? Date.parse(event.data.start_at) <= now : true;
  const used = data.tickets.some((ticket) => ticket.status === "checked_in");
  // By slug once the event has loaded; the id link works too (the event page moves it).
  const eventLink = eventPath(event.data ?? { id: data.event_id });
  const cancellable = !started && !used && (payable || data.status === "free_confirmed");

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      {justCreated && data.status === "free_confirmed" && <Alert tone="success">{t("order.success")}</Alert>}
      {paidNow && data.status === "paid" && <Alert tone="success">{t("order.paidSuccess")}</Alert>}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{event.data?.title ?? t("order.title")}</h1>
        <p className="text-sm text-gray-700">
          {t("order.status")}: <strong>{expired ? t("order.status.expired") : t(`order.status.${data.status}`)}</strong>
        </p>
        <Link to={eventLink} className="text-sm underline">
          {t("order.toEvent")}
        </Link>
        <div className="mt-1 flex flex-wrap gap-2">
          {/* For tickets that will be used: a confirmed order of an event still ahead. */}
          {event.data && !started && (data.status === "paid" || data.status === "free_confirmed") && (
            <AddToCalendar links={event.data.calendar_links} />
          )}
          <HelpButton context={{ order_id: data.id }} />
        </div>
      </header>

      <OrderSummary order={data} payable={payable} typeName={typeName} />

      {payable && data.expires_at && (
        <>
          {hold === "ending" ? (
            <p role="status" className="text-sm font-semibold text-red-800">
              {t("order.holdEnding")}
            </p>
          ) : (
            <HoldTimer expiresAt={data.expires_at} now={now} />
          )}
          {/* Payment only once the buyer can see the organizer's refund terms. */}
          {event.data ? (
            <>
              <RefundPolicy policy={event.data.refund_policy} />
              <PaymentPanel
                order={data}
                onPaid={() => {
                  // Amount and ticket count only: no order id.
                  track("purchase", {
                    currency: "KZT",
                    value: amountDue(data),
                    quantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
                    ticket_kind: "paid",
                  });
                  setPaidNow(true);
                  window.scrollTo({ top: 0 });
                }}
                onError={setPayError}
              />
            </>
          ) : event.isError ? (
            <ErrorState error={event.error} onRetry={() => event.refetch()} />
          ) : (
            <Loading />
          )}
        </>
      )}
      {payError && data.status === "cancelled" && (
        <Alert tone="error">
          {payError}{" "}
          <Link to={eventLink} className="underline">
            {t("order.startAgain")}
          </Link>
        </Alert>
      )}
      {expired && (
        <Alert tone="error">
          {t("order.expired")}{" "}
          <Link to={eventLink} className="underline">
            {t("order.startAgain")}
          </Link>
        </Alert>
      )}
      {data.status === "paid" && <p className="text-sm text-gray-700">{t("order.paidRefundNote")}</p>}
      {cancellable && <CancelOrderButton order={data} />}

      {data.tickets.length > 0 && (
        <ul className="flex flex-col gap-4">
          {data.tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} ticketTypeName={typeName(ticket.ticket_type_id)} />
          ))}
        </ul>
      )}
    </section>
  );
}
