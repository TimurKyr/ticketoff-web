import type { OrderOut } from "@/lib/api/types";

/**
 * After `expires_at` we keep the payment open this long: our clock may still be a little off
 * from the server's, and the server decides at pay time (409 "Checkout expired" if too late).
 */
export const HOLD_GRACE_MS = 60_000;

/**
 * State of a pending checkout's hold at `now` (server time):
 * - `active`: running, show the countdown;
 * - `ending`: just past `expires_at`, payment still offered, the server decides;
 * - `expired`: over, the API no longer counts it and refuses to pay;
 * - `none`: not a pending checkout.
 * The API keeps an expired order `pending` until someone tries to pay it, so the status
 * alone does not tell; `expires_at` does.
 */
export type HoldState = "none" | "active" | "ending" | "expired";

export function holdState(order: OrderOut, now: number): HoldState {
  if (order.status !== "pending" || !order.expires_at) return "none";
  const end = Date.parse(order.expires_at);
  if (now < end) return "active";
  return now < end + HOLD_GRACE_MS ? "ending" : "expired";
}

/** A pending checkout whose hold is over (grace included). */
export function isExpired(order: OrderOut, now: number): boolean {
  return holdState(order, now) === "expired";
}

/** Amount to pay: both numbers come from the server (total before discount, discount). */
export function amountDue(order: OrderOut): number {
  return order.total_kzt - order.discount_kzt;
}

/** "mm:ss" left until `iso`, never negative. */
export function timeLeft(iso: string, now: number): string {
  const seconds = Math.max(0, Math.ceil((Date.parse(iso) - now) / 1000));
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
