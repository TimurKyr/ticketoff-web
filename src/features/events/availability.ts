import type { EventOut, PublicTicketTypeOut } from "@/lib/api/types";

// Same rules and order as the backend registration checks (orders/service.py,
// _ensure_registration_open and _check_ticket_type), so the form is hidden exactly
// when the API would refuse it.

/** "Осталось мало билетов" on the event page: a type with at most this many left (brief §7a). */
export const FEW_LEFT = 10;

export type RegistrationState = "open" | "started" | "notOpen" | "closed";

export function registrationState(event: EventOut, now: number): RegistrationState {
  if (Date.parse(event.start_at) <= now) return "started";
  if (event.registration_opens_at && now < Date.parse(event.registration_opens_at)) return "notOpen";
  if (event.registration_closes_at && now >= Date.parse(event.registration_closes_at)) return "closed";
  return "open";
}

export type SalesState = "open" | "notStarted" | "ended";

export function salesState(type: PublicTicketTypeOut, now: number): SalesState {
  if (type.sales_start_at && now < Date.parse(type.sales_start_at)) return "notStarted";
  if (type.sales_end_at && now >= Date.parse(type.sales_end_at)) return "ended";
  return "open";
}

/** Without an end time, an event counts as over this long after it starts. */
const DEFAULT_LENGTH_MS = 12 * 60 * 60 * 1000;

/** The event is over: its end time passed (or half a day after the start, if it has none). */
export function isEventEnded(event: Pick<EventOut, "start_at" | "end_at">, now: number): boolean {
  const end = event.end_at ? Date.parse(event.end_at) : Date.parse(event.start_at) + DEFAULT_LENGTH_MS;
  return end <= now;
}

/** Why the order forms are not shown on the event page, or null when they are. */
export type OrderBlock = "cancelled" | "suspended" | "ended" | RegistrationState;

/**
 * What the event page shows instead of the order forms. A cancelled event says so on its
 * own; a platform suspension (FE-22 #1) comes before the time-based reasons, so a buyer is
 * not told to wait for a registration that would still be refused.
 */
export function orderBlock(event: EventOut, now: number): Exclude<OrderBlock, "open"> | null {
  if (event.status === "cancelled") return "cancelled";
  if (event.sales_suspended) return "suspended";
  if (isEventEnded(event, now)) return "ended";
  const registration = registrationState(event, now);
  return registration === "open" ? null : registration;
}
