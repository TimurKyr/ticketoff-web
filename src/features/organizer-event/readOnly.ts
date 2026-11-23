import type { EventOut } from "@/lib/api/types";

/**
 * Past and cancelled events are read-only (R-20, UC12): no refunds, cancellations or staff
 * changes from the event's tabs. "Past" is by time, not only by status: a published event
 * whose end (or start, without an end) has passed is over, as the analytics buckets count it.
 */
export function isEventOver(event: Pick<EventOut, "status" | "start_at" | "end_at">, now: number): boolean {
  if (event.status === "cancelled" || event.status === "completed") return true;
  return Date.parse(event.end_at ?? event.start_at) <= now;
}
