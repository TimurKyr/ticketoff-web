import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { OrderOut } from "@/lib/api/types";

/** The API may cancel an expired hold a little late, so we ask once more after this delay. */
export const HOLD_RECHECK_MS = 4000;

/**
 * When a pending order's hold runs out, the server cancels it and releases the seats, but the
 * cache still has the old order. At that moment refetch the order, the user's order list and
 * the event's ticket types (remaining stock), then once more a few seconds later.
 */
export function useHoldExpiry(orders: OrderOut[] | undefined): void {
  const queryClient = useQueryClient();
  // Only pending orders with a running hold matter; a string key keeps refetches of the
  // same data from rescheduling the timers.
  const holds = (orders ?? [])
    .filter((order) => order.status === "pending" && order.expires_at)
    .map((order) => `${order.id}|${order.event_id}|${order.expires_at}`)
    .join(",");

  useEffect(() => {
    if (!holds) return;
    const timers: number[] = [];
    for (const hold of holds.split(",")) {
      const [orderId, eventId, expiresAt] = hold.split("|");
      const delay = Date.parse(expiresAt) - Date.now();
      // Already over when loaded: the data is as fresh as the server has it.
      if (delay <= 0) continue;
      const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
        void queryClient.invalidateQueries({ queryKey: ["orders", "me"] });
        void queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", eventId] });
      };
      timers.push(
        window.setTimeout(() => {
          refresh();
          timers.push(window.setTimeout(refresh, HOLD_RECHECK_MS));
        }, delay),
      );
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [holds, queryClient]);
}
