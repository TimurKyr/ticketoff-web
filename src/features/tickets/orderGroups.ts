import { isEventEnded } from "@/features/events/availability";
import type { EventOut, OrderOut } from "@/lib/api/types";

export type OrderTab = "upcoming" | "past";

/**
 * «Мои билеты» by event date (FE-22 #10): events still ahead first, nearest on top; past ones
 * most recent first. An order whose event is not loaded yet counts as upcoming, at the end.
 */
export function groupOrders(
  orders: OrderOut[],
  events: Map<string, Pick<EventOut, "start_at" | "end_at">>,
  now: number
): Record<OrderTab, OrderOut[]> {
  const start = (order: OrderOut) => {
    const event = events.get(order.event_id);
    return event ? Date.parse(event.start_at) : Number.POSITIVE_INFINITY;
  };
  const upcoming: OrderOut[] = [];
  const past: OrderOut[] = [];
  for (const order of orders) {
    const event = events.get(order.event_id);
    (event && isEventEnded(event, now) ? past : upcoming).push(order);
  }
  upcoming.sort((a, b) => start(a) - start(b));
  past.sort((a, b) => start(b) - start(a));
  return { upcoming, past };
}
