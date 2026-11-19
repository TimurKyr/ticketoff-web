import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import {
  amountDue,
  CancelOrderButton,
  isExpired,
  PaymentPanel,
  RefundPolicy,
  timeLeft,
} from "@/features/checkout";
import { useEvent, usePublicTicketTypes } from "@/features/events/api";
import { HelpButton } from "@/features/support";
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

  const order = useOrder(orderId);
  const eventId = order.data?.event_id ?? "";
  const event = useEvent(eventId);
  const ticketTypes = usePublicTicketTypes(eventId);
  // Every second only while a hold is running.
  const now = useNow(order.data?.status === "pending" ? 1000 : 30_000);

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
  const expired = isExpired(data, now);
  const payable = data.status === "pending" && !expired;
  // The API refuses to cancel once the event has started or a ticket was used at the door.
  const started = event.data ? Date.parse(event.data.start_at) <= now : true;
  const used = data.tickets.some((ticket) => ticket.status === "checked_in");
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
        <Link to={`/events/${data.event_id}`} className="text-sm underline">
          {t("order.toEvent")}
        </Link>
        <HelpButton context={{ order_id: data.id }} className="mt-1" />
      </header>

      <OrderSummary order={data} payable={payable} typeName={typeName} />

      {payable && data.expires_at && (
        <>
          <HoldTimer expiresAt={data.expires_at} now={now} />
          <RefundPolicy policy={event.data?.refund_policy} />
          <PaymentPanel order={data} onPaid={() => {
              setPaidNow(true);
              window.scrollTo({ top: 0 });
            }} />
        </>
      )}
      {expired && (
        <Alert tone="error">
          {t("order.expired")}{" "}
          <Link to={`/events/${data.event_id}`} className="underline">
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
