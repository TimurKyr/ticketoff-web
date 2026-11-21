import type { SupportCategory, SupportKind, SupportStatus } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n";

// Complete maps over the API enums: a value added to the backend fails to compile here
// after the types are regenerated, instead of showing a raw key in the UI.

export const CATEGORY_LABELS: Record<SupportCategory, MessageKey> = {
  payment: "support.category.payment",
  refund: "support.category.refund",
  ticket: "support.category.ticket",
  event: "support.category.event",
  account: "support.category.account",
  other: "support.category.other",
};

export const STATUS_LABELS: Record<SupportStatus, MessageKey> = {
  open: "support.status.open",
  in_progress: "support.status.in_progress",
  waiting_customer: "support.status.waiting_customer",
  resolved: "support.status.resolved",
};

export const KIND_LABELS: Record<SupportKind, MessageKey> = {
  attendee: "support.kind.attendee",
  organizer: "support.kind.organizer",
};

/**
 * Status as the viewer should read it: "waiting for the customer" is "Ждёт вашего ответа"
 * for the customer who opened the case, and "Ждёт ответа клиента" for a handler.
 */
export function statusLabel(status: SupportStatus, asHandler: boolean): MessageKey {
  return status === "waiting_customer" && !asHandler ? "support.status.waiting_you" : STATUS_LABELS[status];
}

/** In the order of the maps above, for selects and filters. */
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as SupportCategory[];
export const STATUSES = Object.keys(STATUS_LABELS) as SupportStatus[];
export const KINDS = Object.keys(KIND_LABELS) as SupportKind[];

export function isSupportStatus(value: string | null): value is SupportStatus {
  // Not `value in STATUS_LABELS`: "?status=toString" must not count as a status.
  return (STATUSES as (string | null)[]).includes(value);
}

export function isSupportKind(value: string | null): value is SupportKind {
  return (KINDS as (string | null)[]).includes(value);
}
