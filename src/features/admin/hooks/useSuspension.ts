import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { AdminUserOut, EventOut } from "@/lib/api/types";

interface Vars {
  id: string;
  /** true = suspend, false = unsuspend. */
  suspend: boolean;
}

function useSuspension<T>(base: "events" | "users") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, suspend }: Vars) =>
      apiClient.post<T>(`/admin/${base}/${encodeURIComponent(id)}/${suspend ? "suspend" : "unsuspend"}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "search"] }),
  });
}

export const useSuspendEvent = () => useSuspension<EventOut>("events");
export const useSuspendUser = () => useSuspension<AdminUserOut>("users");
