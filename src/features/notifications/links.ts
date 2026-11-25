import type { NotificationOut, NotificationType } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n";

/** What each notification type is called in the bell (typed: a new API type must be added). */
export const NOTIFICATION_LABELS: Record<NotificationType, MessageKey> = {
  order_confirmed: "notif.type.order_confirmed",
  ticket_issued: "notif.type.ticket_issued",
  event_updated: "notif.type.event_updated",
  event_cancelled: "notif.type.event_cancelled",
  refund_processed: "notif.type.refund_processed",
  support_reply: "notif.type.support_reply",
  account_verification: "notif.type.account_verification",
  payment_failed: "notif.type.payment_failed",
  support_status: "notif.type.support_status",
  password_reset: "notif.type.password_reset",
};

function str(payload: NotificationOut["payload"], key: string): string | null {
  const value = payload?.[key];
  return typeof value === "string" && value ? value : null;
}

/**
 * Where a click on the notification leads, from its payload (IDs only), or null.
 *
 * order_* / payment_failed / refund_processed → the order; support_* → the case;
 * event_updated → the event page; event_cancelled → the buyer's (first) order, because a
 * cancelled event's public page is gone. Unknown types and missing ids: nowhere.
 */
export function notificationLink(item: NotificationOut): string | null {
  const { payload } = item;
  switch (item.type) {
    case "order_confirmed":
    case "ticket_issued":
    case "payment_failed":
    case "refund_processed": {
      const order = str(payload, "order_id");
      return order ? `/orders/${order}` : null;
    }
    case "support_reply":
    case "support_status": {
      const caseId = str(payload, "case_id");
      return caseId ? `/support/cases/${caseId}` : null;
    }
    case "event_updated": {
      const event = str(payload, "event_id");
      return event ? `/events/${event}` : null;
    }
    case "event_cancelled": {
      const orders = payload?.order_ids;
      const first = Array.isArray(orders) && typeof orders[0] === "string" ? orders[0] : null;
      if (first) return `/orders/${first}`;
      const event = str(payload, "event_id");
      return event ? `/events/${event}` : null;
    }
    default:
      return null;
  }
}

/** "9+" beyond nine, so the badge stays one small circle. */
export function badgeText(count: number): string {
  return count > 9 ? "9+" : String(count);
}
