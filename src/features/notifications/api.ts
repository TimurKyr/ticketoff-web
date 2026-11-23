import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { NotificationOut, NotificationPage } from "@/lib/api/types";

/** The bell shows the latest ones; the API counts every unread one (unread_count). */
export const BELL_LIMIT = 10;
const POLL_MS = 60_000;

export const notificationKeys = { bell: ["notifications", "bell"] as const };

/**
 * The latest notifications and the unread count, refreshed every minute while the tab is
 * visible (react-query does not poll in the background by default). No WebSocket.
 */
export function useBellNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.bell,
    queryFn: () => apiClient.get<NotificationPage>(`/notifications?limit=${BELL_LIMIT}`),
    enabled,
    refetchInterval: POLL_MS,
  });
}

/** Mark one read: the badge drops at once, then the list is re-read from the API. */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<NotificationOut>(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.bell });
      const previous = queryClient.getQueryData<NotificationPage>(notificationKeys.bell);
      if (previous) {
        const target = previous.items.find((item) => item.id === id);
        if (target && target.read_at === null) {
          const now = new Date().toISOString();
          queryClient.setQueryData<NotificationPage>(notificationKeys.bell, {
            ...previous,
            unread_count: Math.max(0, previous.unread_count - 1),
            items: previous.items.map((item) => (item.id === id ? { ...item, read_at: now } : item)),
          });
        }
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(notificationKeys.bell, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.bell }),
  });
}
