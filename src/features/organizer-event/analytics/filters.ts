/** Filters of the organizer analytics (R-118), sent to the API; the server narrows the figures. */
export interface AnalyticsFilters {
  /** "YYYY-MM-DD", a day in Asia/Almaty, inclusive; "" for no bound. */
  from_date: string;
  to_date: string;
  /** One of the event's ticket types; "" for all. Only the event endpoint takes it. */
  ticket_type_id?: string;
}

export const NO_FILTERS: AnalyticsFilters = { from_date: "", to_date: "", ticket_type_id: "" };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A reversed period (the API answers 422): the form shows an error and sends nothing new. */
export function isReversed(filters: AnalyticsFilters): boolean {
  return Boolean(filters.from_date && filters.to_date && filters.from_date > filters.to_date);
}

/** Query string with only the filters set (empty → ""), malformed days left out. */
export function analyticsQuery(filters: AnalyticsFilters): string {
  const params = new URLSearchParams();
  if (DAY.test(filters.from_date)) params.set("from_date", filters.from_date);
  if (DAY.test(filters.to_date)) params.set("to_date", filters.to_date);
  if (filters.ticket_type_id) params.set("ticket_type_id", filters.ticket_type_id);
  const query = params.toString();
  return query ? `?${query}` : "";
}
