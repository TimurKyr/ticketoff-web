import type { MessageKey } from "@/lib/i18n";

// Every action type the backend writes to an event's audit log (app/**/audit.log calls).
// A type added later shows as its raw name until it gets a label here.
export const ACTION_LABELS: Record<string, MessageKey> = {
  "event.published": "history.action.event.published",
  "event.unpublished": "history.action.event.unpublished",
  "event.cancelled": "history.action.event.cancelled",
  "event.capacity_changed": "history.action.event.capacity_changed",
  "event.sales_suspended": "history.action.event.sales_suspended",
  "event.sales_unsuspended": "history.action.event.sales_unsuspended",
  "ticket_type.price_changed": "history.action.ticket_type.price_changed",
  "ticket_type.quantity_changed": "history.action.ticket_type.quantity_changed",
  "order.cancelled": "history.action.order.cancelled",
  "order.refunded": "history.action.order.refunded",
  "payment.order_succeeded": "history.action.payment.order_succeeded",
  "payment.order_failed": "history.action.payment.order_failed",
  "payment.activation_succeeded": "history.action.payment.activation_succeeded",
  "promo.campaign_created": "history.action.promo.campaign_created",
  "promo.code_created": "history.action.promo.code_created",
  "promo.code_disabled": "history.action.promo.code_disabled",
  "promo.code_enabled": "history.action.promo.code_enabled",
  "ticket.checked_in": "history.action.ticket.checked_in",
  "ticket.check_in_reversed": "history.action.ticket.check_in_reversed",
  "support.case_opened": "history.action.support.case_opened",
  "support.case_assigned": "history.action.support.case_assigned",
  "support.case_status_changed": "history.action.support.case_status_changed",
};

/** The filter: groups (a prefix ending in "." is a prefix match in the API), then each type. */
export const ACTION_GROUPS: { prefix: string; label: MessageKey }[] = [
  { prefix: "order.", label: "history.group.order" },
  { prefix: "payment.", label: "history.group.payment" },
  { prefix: "ticket.", label: "history.group.ticket" },
  { prefix: "promo.", label: "history.group.promo" },
  { prefix: "event.", label: "history.group.event" },
  { prefix: "ticket_type.", label: "history.group.ticket_type" },
  { prefix: "support.", label: "history.group.support" },
];
