import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import type { EventOrderOut, OrderStatus, TicketStatus } from "@/lib/api/types";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useCancelOrder, useRefundOrder } from "../api";
import { shortOrderId } from "./orderNumber";

const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-green-100 text-green-900",
  free_confirmed: "bg-green-100 text-green-900",
  cancelled: "bg-gray-200 text-gray-800",
  refunded: "bg-purple-100 text-purple-900",
};

const TICKET_STATUS_CLASSES: Record<TicketStatus, string> = {
  valid: "text-green-800",
  checked_in: "text-blue-800",
  cancelled: "text-gray-600",
  refunded: "text-purple-800",
};

type Pending = { kind: "refund" } | { kind: "cancel" } | null;

/**
 * One order: buyer, guests with their tickets, money, and the two actions. The buttons
 * appear only when the API says the action is allowed (can_refund / can_cancel), never
 * on a read-only event; the result always comes from the server (no optimistic update).
 */
export function OrderCard({
  eventId,
  order,
  tz,
  readOnly,
}: {
  eventId: string;
  order: EventOrderOut;
  tz: string;
  readOnly: boolean;
}) {
  const { t, lang } = useI18n();
  // Kept here, not in OrderActions: after a refund or a cancellation the order comes back
  // without the flag, the actions unmount, and the result must still be shown.
  const [done, setDone] = useState<string | null>(null);
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">
            {t("common.numberSign")}<span className="font-mono">{shortOrderId(order.id)}</span>
          </span>
          <span
            className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${ORDER_STATUS_CLASSES[order.status]}`}
          >
            {t(`order.status.${order.status}`)}
          </span>
          {order.hold_expired && (
            <span className="text-xs text-gray-700">{t("orgEvent.orders.holdExpired")}</span>
          )}
        </div>
        <time dateTime={order.created_at} className="text-xs text-gray-600">
          {formatDateTime(order.created_at, lang, tz)}
        </time>
      </div>

      <p className="break-all text-sm">
        <span className="text-gray-600">{t("orgEvent.orders.buyer")}: </span>
        {order.buyer_email}
      </p>

      <ul className="flex flex-col gap-1 text-sm" aria-label={t("orgEvent.orders.guests")}>
        {order.guests.map((guest) => (
          <li key={guest.id} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{guest.name}</span>
            {guest.email && <span className="break-all text-gray-700">{guest.email}</span>}
            {guest.ticket_type_name && <span className="text-gray-600">· {guest.ticket_type_name}</span>}
            <span className={guest.ticket ? TICKET_STATUS_CLASSES[guest.ticket.status] : "text-gray-600"}>
              ·{" "}
              {guest.ticket ? t(`ticket.status.${guest.ticket.status}`) : t("orgEvent.orders.noTicket")}
              {guest.ticket?.checked_in_at && ` ${formatDateTime(guest.ticket.checked_in_at, lang, tz)}`}
            </span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <div className="flex gap-1">
          <dt className="text-gray-600">{t("orgEvent.orders.total")}:</dt>
          <dd className="font-medium tabular-nums">{formatKzt(order.total_kzt, lang)}</dd>
        </div>
        {order.discount_kzt > 0 && (
          <div className="flex gap-1">
            <dt className="text-gray-600">{t("orgEvent.orders.discount")}:</dt>
            <dd className="tabular-nums">
              −{formatKzt(order.discount_kzt, lang)}
              {order.promo_code && <span className="ml-1 font-mono">({order.promo_code})</span>}
            </dd>
          </div>
        )}
      </dl>

      {!readOnly && (order.can_refund || order.can_cancel) && (
        <OrderActions eventId={eventId} order={order} onDone={setDone} />
      )}
      {done && <Alert tone="success">{done}</Alert>}
    </li>
  );
}

function OrderActions({
  eventId,
  order,
  onDone,
}: {
  eventId: string;
  order: EventOrderOut;
  onDone: (message: string) => void;
}) {
  const { t, lang } = useI18n();
  const refund = useRefundOrder(eventId);
  const cancel = useCancelOrder(eventId);
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const busy = refund.isPending || cancel.isPending;
  // What the buyer paid: the amount a refund returns (the API refunds the whole payment).
  const paid = order.total_kzt - order.discount_kzt;
  const tickets = order.guests.filter((g) => g.ticket).length;

  async function confirm() {
    setError(null);
    try {
      if (pending?.kind === "refund") {
        const result = await refund.mutateAsync({ orderId: order.id, reason: reason.trim() || null });
        onDone(t("orgEvent.orders.refunded").replace("$1", formatKzt(result.refund.amount_kzt, lang)));
      } else {
        await cancel.mutateAsync(order.id);
        onDone(t("orgEvent.orders.cancelled"));
      }
      setPending(null);
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {order.can_refund && (
          <Button variant="secondary" onClick={() => setPending({ kind: "refund" })} aria-haspopup="dialog">
            {t("orgEvent.orders.refund")}
          </Button>
        )}
        {order.can_cancel && (
          <Button variant="ghost" className="text-red-800" onClick={() => setPending({ kind: "cancel" })} aria-haspopup="dialog">
            {t(order.status === "pending" ? "orgEvent.orders.cancelOrder" : "orgEvent.orders.cancelRegistration")}
          </Button>
        )}
      </div>
      {pending && (
        <Dialog
          title={t(pending.kind === "refund" ? "orgEvent.orders.refundTitle" : "orgEvent.orders.cancelTitle").replace(
            "$1",
            shortOrderId(order.id)
          )}
          onClose={() => {
            setPending(null);
            setError(null);
          }}
        >
          <div className="flex flex-col gap-3 text-sm">
            {pending.kind === "refund" ? (
              <>
                <p>
                  {t("orgEvent.orders.refundText")
                    .replace("$1", formatKzt(paid, lang))
                    .replace("$2", order.buyer_email)}
                </p>
                <p>{t("orgEvent.orders.ticketsInvalid").replace("$1", String(tickets))}</p>
                <p className="text-xs text-gray-600">{t("orgEvent.orders.refundSimulated")}</p>
                <TextAreaField
                  label={t("orgEvent.orders.reason")}
                  rows={2}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </>
            ) : (
              <p>{t("orgEvent.orders.cancelText").replace("$1", String(tickets))}</p>
            )}
            {error && <Alert tone="error">{error}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" onClick={confirm} disabled={busy} data-autofocus>
                {busy
                  ? t("common.loading")
                  : t(pending.kind === "refund" ? "orgEvent.orders.refundConfirm" : "orgEvent.orders.cancelConfirm")}
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
                {t("orgEvent.orders.keep")}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
