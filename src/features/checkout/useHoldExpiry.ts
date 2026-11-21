import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import type { OrderOut } from "@/lib/api/types";
import { serverNow } from "@/lib/serverClock";

/** The API may count a hold as over a little late, so we ask once more after this delay. */
export const HOLD_RECHECK_MS = 4000;

function refreshHold(queryClient: QueryClient, orderId: string, eventId: string): void {
  void queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
  void queryClient.invalidateQueries({ queryKey: ["orders", "me"] });
  // Remaining stock: the API stops counting the held tickets once the hold is over.
  void queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", eventId] });
}

/**
 * Keeps cached data in step with pending checkouts' holds. When a hold runs out (server time),
 * refetch the order, the user's order list and the event's ticket types, then once more a few
 * seconds later. A hold that is already over when the page opens (e.g. it ended at 14:00 and
 * the order is opened at 14:05) gets one refetch right away; it is not repeated, since the
 * API leaves such an order as it is until someone tries to pay it.
 */
export function useHoldExpiry(orders: OrderOut[] | undefined): void {
  const queryClient = useQueryClient();
  // Holds already refreshed on load, so refetches of the same data don't loop.
  const refreshedOnLoad = useRef(new Set<string>());
  // A string key keeps refetches of the same data from rescheduling the timers.
  const holds = (orders ?? [])
    .filter((order) => order.status === "pending" && order.expires_at)
    .map((order) => `${order.id}|${order.event_id}|${order.expires_at}`)
    .join(",");

  useEffect(() => {
    if (!holds) return;
    const timers: number[] = [];
    for (const hold of holds.split(",")) {
      const [orderId, eventId, expiresAt] = hold.split("|");
      const delay = Date.parse(expiresAt) - serverNow();
      if (delay <= 0) {
        if (!refreshedOnLoad.current.has(hold)) {
          refreshedOnLoad.current.add(hold);
          refreshHold(queryClient, orderId, eventId);
        }
        continue;
      }
      timers.push(
        window.setTimeout(() => {
          refreshHold(queryClient, orderId, eventId);
          timers.push(window.setTimeout(() => refreshHold(queryClient, orderId, eventId), HOLD_RECHECK_MS));
        }, delay),
      );
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [holds, queryClient]);
}
