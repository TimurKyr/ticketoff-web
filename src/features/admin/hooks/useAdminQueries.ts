import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  PaymentPage,
  PaymentStatus,
  PlatformSettingsOut,
  PlatformSettingsUpdate,
  PromoActivityPage,
  RefundPage,
  SearchPage,
  SearchType,
} from "@/lib/api/types";

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  return sp.toString();
}

export function useAdminSearch(q: string, type: SearchType, limit: number, offset: number) {
  return useQuery({
    queryKey: ["admin", "search", type, q, limit, offset],
    queryFn: () => apiClient.get<SearchPage>(`/admin/search?${qs({ q, type, limit, offset })}`),
    enabled: q.length > 0,
  });
}

export function useAdminPayments(status: PaymentStatus | undefined, limit: number, offset: number) {
  return useQuery({
    queryKey: ["admin", "payments", status ?? "all", limit, offset],
    queryFn: () => apiClient.get<PaymentPage>(`/admin/payments?${qs({ status, limit, offset })}`),
  });
}

export function useAdminRefunds(limit: number, offset: number) {
  return useQuery({
    queryKey: ["admin", "refunds", limit, offset],
    queryFn: () => apiClient.get<RefundPage>(`/admin/refunds?${qs({ limit, offset })}`),
  });
}

export function useAdminActivations(limit: number, offset: number) {
  return useQuery({
    queryKey: ["admin", "activations", limit, offset],
    queryFn: () => apiClient.get<PaymentPage>(`/admin/activations?${qs({ limit, offset })}`),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => apiClient.get<PlatformSettingsOut>("/admin/settings"),
  });
}

/** PATCH /admin/settings (R-127): only the fields sent change. */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: PlatformSettingsUpdate) =>
      apiClient.patch<PlatformSettingsOut>("/admin/settings", patch),
    onSuccess: (data) => queryClient.setQueryData(["admin", "settings"], data),
  });
}

/** Promo code activity across the platform (R-128), biggest discount first. */
export function usePromoActivity(fromDate: string, toDate: string, limit: number, offset: number) {
  return useQuery({
    queryKey: ["admin", "promo-activity", fromDate, toDate, limit, offset],
    queryFn: () =>
      apiClient.get<PromoActivityPage>(
        `/admin/promo-activity?${qs({ from_date: fromDate, to_date: toDate, limit, offset })}`
      ),
    placeholderData: (previous) => previous,
  });
}
