import type { OrderOut } from "@/lib/api/types";

/** A pending checkout whose hold is over: the API no longer counts it and refuses to pay. */
export function isExpired(order: OrderOut, now: number): boolean {
  return order.status === "pending" && Boolean(order.expires_at) && now >= Date.parse(order.expires_at!);
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
