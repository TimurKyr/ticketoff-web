import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  CheckinStatsOut,
  EventAnalyticsOut,
  EventBucket,
  EventHistoryPage,
  EventOrderPage,
  OrderOut,
  OrderStatus,
  OverviewOut,
  PaymentSummaryOut,
  RefundResultOut,
  StaffOut,
  TimelinePage,
} from "@/lib/api/types";

import { analyticsQuery, NO_FILTERS, type AnalyticsFilters } from "./analytics/filters";

export const ORDERS_PAGE_SIZE = 20;
export const TIMELINE_PAGE_SIZE = 20;
export const HISTORY_PAGE_SIZE = 10;

// Everything about one event lives under the organizer's event key, so one invalidation of
// ["organizer", "event", id] refreshes every tab (and the organizer feature's own data).
const eventKey = (id: string) => ["organizer", "event", id] as const;
export const eventKeys = {
  event: eventKey,
  orders: (id: string, q: string, status: OrderStatus | null, page: number) =>
    [...eventKey(id), "orders", q, status ?? "all", page] as const,
  analytics: (id: string) => [...eventKey(id), "analytics"] as const,
  checkinStats: (id: string) => [...eventKey(id), "checkin-stats"] as const,
  paymentSummary: (id: string) => [...eventKey(id), "payment-summary"] as const,
  timeline: (id: string, filters: TimelineFilters, page: number | "total") =>
    [...eventKey(id), "timeline", filters, page] as const,
  staff: (id: string) => [...eventKey(id), "staff"] as const,
};
const analyticsKey = ["organizer", "analytics"] as const;

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  return search.toString();
}

/** After a refund, a cancellation or a staff change: every number that may have moved. */
function useInvalidateEvent(eventId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: eventKey(eventId) }),
      queryClient.invalidateQueries({ queryKey: analyticsKey }),
      // Tickets back on sale: the public event page shows availability.
      queryClient.invalidateQueries({ queryKey: ["events"] }),
    ]);
}

// --- «Участники и заказы» -------------------------------------------------------------------

/** GET /events/{id}/orders (BE-30), newest first. `page` starts at 1. */
export function useEventOrders(eventId: string, q: string, status: OrderStatus | null, page: number) {
  return useQuery({
    queryKey: eventKeys.orders(eventId, q, status, page),
    queryFn: () =>
      apiClient.get<EventOrderPage>(
        `/events/${eventId}/orders?${query({
          q,
          status,
          limit: ORDERS_PAGE_SIZE,
          offset: (page - 1) * ORDERS_PAGE_SIZE,
        })}`
      ),
    // Keep the previous page visible only while paging within the same search and filter.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[4] === q && previousQuery?.queryKey[5] === (status ?? "all")
        ? previous
        : undefined,
  });
}

export function useRefundOrder(eventId: string) {
  const invalidate = useInvalidateEvent(eventId);
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string | null }) =>
      apiClient.post<RefundResultOut>(`/orders/${orderId}/refund`, { reason }),
    onSuccess: invalidate,
  });
}

export function useCancelOrder(eventId: string) {
  const invalidate = useInvalidateEvent(eventId);
  return useMutation({
    mutationFn: (orderId: string) => apiClient.post<OrderOut>(`/orders/${orderId}/cancel`),
    onSuccess: invalidate,
  });
}

/** "Выручка (демо)": GET /events/{id}/payments/summary. */
export function usePaymentSummary(eventId: string) {
  return useQuery({
    queryKey: eventKeys.paymentSummary(eventId),
    queryFn: () => apiClient.get<PaymentSummaryOut>(`/events/${eventId}/payments/summary`),
  });
}

// --- «Аналитика» --------------------------------------------------------------------------

/** Narrowed on the server by period and ticket type (R-118); the last page stays while loading. */
export function useEventAnalytics(eventId: string, filters: AnalyticsFilters = NO_FILTERS) {
  return useQuery({
    queryKey: [...eventKeys.analytics(eventId), filters] as const,
    queryFn: () =>
      apiClient.get<EventAnalyticsOut>(`/organizer/analytics/events/${eventId}${analyticsQuery(filters)}`),
    placeholderData: (previous) => previous,
  });
}

/** Attendance at the door: GET /checkin/events/{id}/stats. */
export function useCheckinStats(eventId: string) {
  return useQuery({
    queryKey: eventKeys.checkinStats(eventId),
    queryFn: () => apiClient.get<CheckinStatsOut>(`/checkin/events/${eventId}/stats`),
  });
}

// --- «История» ----------------------------------------------------------------------------

export interface TimelineFilters {
  /** ISO datetimes (aware), or "" for no bound. */
  from_date: string;
  to_date: string;
  /** Exact type, or a prefix ending in "." ("order."); "" = all. */
  action_type: string;
}

function timelinePath(eventId: string, filters: TimelineFilters, limit: number, offset: number) {
  return `/events/${eventId}/timeline?${query({ ...filters, limit, offset })}`;
}

/**
 * The API lists the timeline oldest first; the tab shows it newest first. So the total is
 * read first (one row), and page N is the slice counted back from the end, reversed.
 */
export function useTimelinePage(eventId: string, filters: TimelineFilters, page: number) {
  const count = useQuery({
    queryKey: eventKeys.timeline(eventId, filters, "total"),
    queryFn: () => apiClient.get<TimelinePage>(timelinePath(eventId, filters, 1, 0)),
  });
  const total = count.data?.total;
  const end = total === undefined ? 0 : Math.max(0, total - (page - 1) * TIMELINE_PAGE_SIZE);
  const start = Math.max(0, end - TIMELINE_PAGE_SIZE);
  const rows = useQuery({
    queryKey: [...eventKeys.timeline(eventId, filters, page), total] as const,
    queryFn: () => apiClient.get<TimelinePage>(timelinePath(eventId, filters, end - start, start)),
    enabled: total !== undefined && end > start,
    select: (data) => ({ ...data, items: [...data.items].reverse() }),
  });
  return { count, rows, total: total ?? 0 };
}

// --- «Контролёры» -------------------------------------------------------------------------

export function useStaff(eventId: string) {
  return useQuery({
    queryKey: eventKeys.staff(eventId),
    queryFn: () => apiClient.get<StaffOut[]>(`/events/${eventId}/staff`),
  });
}

export function useAddStaff(eventId: string) {
  const invalidate = useInvalidateEvent(eventId);
  return useMutation({
    mutationFn: (email: string) => apiClient.post<StaffOut>(`/events/${eventId}/staff`, { email }),
    onSuccess: invalidate,
  });
}

export function useRemoveStaff(eventId: string) {
  const invalidate = useInvalidateEvent(eventId);
  return useMutation({
    mutationFn: (userId: string) => apiClient.delete<void>(`/events/${eventId}/staff/${userId}`),
    onSuccess: invalidate,
  });
}

// --- dashboard: overview and event history ------------------------------------------------

/** A period narrows `totals` only (R-118); event counts are never narrowed. */
export function useOrganizerOverview(period: AnalyticsFilters = NO_FILTERS) {
  const filters = { from_date: period.from_date, to_date: period.to_date };
  return useQuery({
    queryKey: [...analyticsKey, "overview", filters] as const,
    queryFn: () => apiClient.get<OverviewOut>(`/organizer/analytics/overview${analyticsQuery(filters)}`),
    placeholderData: (previous) => previous,
  });
}

export function useEventHistory(bucket: EventBucket | null, page: number) {
  return useQuery({
    queryKey: [...analyticsKey, "events", bucket ?? "all", page] as const,
    queryFn: () =>
      apiClient.get<EventHistoryPage>(
        `/organizer/analytics/events?${query({
          bucket,
          limit: HISTORY_PAGE_SIZE,
          offset: (page - 1) * HISTORY_PAGE_SIZE,
        })}`
      ),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[3] === (bucket ?? "all") ? previous : undefined,
  });
}
