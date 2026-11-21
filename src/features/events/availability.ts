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
