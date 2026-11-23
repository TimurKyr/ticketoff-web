import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  EventOut,
  EventPage,
  OrderOut,
  PublicTicketTypeOut,
  RegistrationCreate,
  VenueOut,
} from "@/lib/api/types";

export const EVENTS_PAGE_SIZE = 12;

export interface EventFilters {
  q?: string;
  category?: string;
  /** Exact venue city, e.g. "Алматы" ("" = all) */
  city?: string;
  from_date?: string;
  to_date?: string;
  offset?: number;
}

function toQuery(filters: EventFilters): string {
  const params = new URLSearchParams({ limit: String(EVENTS_PAGE_SIZE) });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function useEvents(filters: EventFilters) {
  return useQuery({
    queryKey: ["events", "list", filters],
    queryFn: () => apiClient.get<EventPage>(`/events?${toQuery(filters)}`),
    placeholderData: (previous) => previous,
  });
}

/** Upcoming events for the home rows: one request, rows are built on the client. */
export const HOME_EVENTS_LIMIT = 100; // the API maximum

export function useHomeEvents(city: string) {
  const params = new URLSearchParams({ limit: String(HOME_EVENTS_LIMIT) });
  if (city) params.set("city", city);
  return useQuery({
    queryKey: ["events", "home", city],
    queryFn: () => apiClient.get<EventPage>(`/events?${params.toString()}`),
  });
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ["events", "detail", eventId],
    queryFn: () => apiClient.get<EventOut>(`/events/${eventId}`),
    enabled: Boolean(eventId),
  });
}

export function usePublicTicketTypes(eventId: string) {
  return useQuery({
    queryKey: ["events", "ticket-types", eventId],
    queryFn: () =>
      apiClient.get<PublicTicketTypeOut[]>(`/events/${eventId}/ticket-types/public`),
    enabled: Boolean(eventId),
  });
}

/** Venues are few and change rarely: one list, looked up by id. */
export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: () => apiClient.get<VenueOut[]>("/venues"),
    staleTime: 60 * 60 * 1000,
  });
}

export function useVenue(venueId: string | undefined): VenueOut | undefined {
  const { data } = useVenues();
  return venueId ? data?.find((venue) => venue.id === venueId) : undefined;
}

export function registerFree(eventId: string, payload: RegistrationCreate): Promise<OrderOut> {
  return apiClient.post<OrderOut>(`/events/${eventId}/registrations`, payload);
}
