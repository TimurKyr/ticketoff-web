import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  ActivationChecklistOut,
  EventBucket,
  EventCreate,
  EventInventoryOut,
  EventOut,
  EventPage,
  EventUpdate,
  TicketTypeCreate,
  TicketTypeOut,
  TicketTypeUpdate,
} from "@/lib/api/types";

export const ORGANIZER_PAGE_SIZE = 20;

const keys = {
  all: ["organizer"] as const,
  list: (bucket: EventBucket, offset: number) => ["organizer", "events", bucket, offset] as const,
  event: (id: string) => ["organizer", "event", id] as const,
  ticketTypes: (id: string) => ["organizer", "event", id, "ticket-types"] as const,
  inventory: (id: string) => ["organizer", "event", id, "inventory"] as const,
  activation: (id: string) => ["organizer", "event", id, "activation"] as const,
};

export function useMyEvents(bucket: EventBucket, offset: number) {
  return useQuery({
    queryKey: keys.list(bucket, offset),
    queryFn: () =>
      apiClient.get<EventPage>(
        `/organizer/events?bucket=${bucket}&limit=${ORGANIZER_PAGE_SIZE}&offset=${offset}`
      ),
    // Keep the previous page only while paging within the same tab: another tab's events
    // must never be shown under this one.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === bucket ? previous : undefined,
  });
}

/** Any status (drafts too), only for the owner. */
export function useMyEvent(eventId: string) {
  return useQuery({
    queryKey: keys.event(eventId),
    queryFn: () => apiClient.get<EventOut>(`/organizer/events/${eventId}`),
    enabled: Boolean(eventId),
  });
}

export function useTicketTypes(eventId: string) {
  return useQuery({
    queryKey: keys.ticketTypes(eventId),
    queryFn: () => apiClient.get<TicketTypeOut[]>(`/events/${eventId}/ticket-types`),
  });
}

export function useInventory(eventId: string) {
  return useQuery({
    queryKey: keys.inventory(eventId),
    queryFn: () => apiClient.get<EventInventoryOut>(`/events/${eventId}/inventory`),
  });
}

export function useActivation(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.activation(eventId),
    queryFn: () => apiClient.get<ActivationChecklistOut>(`/events/${eventId}/activation`),
    enabled,
  });
}

/** After any change: refetch everything the organizer sees, plus public event data. */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.all }),
      queryClient.invalidateQueries({ queryKey: ["events"] }),
    ]);
}

export function createEvent(payload: EventCreate): Promise<EventOut> {
  return apiClient.post<EventOut>("/events", payload);
}

export function useUpdateEvent(eventId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: EventUpdate) => apiClient.patch<EventOut>(`/events/${eventId}`, payload),
    onSuccess: invalidate,
  });
}

export type EventAction = "publish" | "unpublish" | "cancel" | "duplicate";

/**
 * Body of POST /events/{id}/cancel since BE-37 (optional, reason ≤ 500 characters). Local
 * until schema.d.ts is regenerated from an API that has it.
 */
interface EventCancel {
  reason?: string | null;
}

export function useEventAction(eventId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    // `reason` goes only with "cancel" (EventCancel, BE-37); no body when there is none.
    mutationFn: ({ name, reason }: { name: EventAction; reason?: string | null }) =>
      apiClient.post<EventOut>(
        `/events/${eventId}/${name}`,
        name === "cancel" && reason ? ({ reason } satisfies EventCancel) : undefined
      ),
    onSuccess: invalidate,
  });
}

export function useCreateTicketType(eventId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: TicketTypeCreate) =>
      apiClient.post<TicketTypeOut>(`/events/${eventId}/ticket-types`, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTicketType(eventId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TicketTypeUpdate }) =>
      apiClient.patch<TicketTypeOut>(`/events/${eventId}/ticket-types/${id}`, payload),
    onSuccess: invalidate,
  });
}

export type ActivationStep = "simulate-verification" | "accept-terms" | "pay";

export function useActivationStep(eventId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (step: ActivationStep) =>
      apiClient.post<ActivationChecklistOut>(`/events/${eventId}/activation/${step}`),
    onSuccess: invalidate,
  });
}
