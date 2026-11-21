import { useQuery } from "@tanstack/react-query";

import { ApiError, apiClient } from "@/lib/api/client";
import type {
  CheckoutCreate,
  OrderOut,
  PaymentResultOut,
  PayOrderIn,
  PromoCheckOut,
  PromoQrOut,
} from "@/lib/api/types";

/** Paid tickets: a pending order that holds the tickets until `expires_at`. */
export function startCheckout(eventId: string, payload: CheckoutCreate): Promise<OrderOut> {
  return apiClient.post<OrderOut>(`/events/${eventId}/checkout`, payload);
}

/** Simulated card: 200 for both results; on "fail" the order stays pending. */
export function payOrder(orderId: string, simulate: PayOrderIn["simulate"]): Promise<PaymentResultOut> {
  return apiClient.post<PaymentResultOut>(`/orders/${orderId}/pay`, { simulate });
}

/** A free registration or my own pending checkout. Paid orders answer 409. */
export function cancelOrder(orderId: string): Promise<OrderOut> {
  return apiClient.post<OrderOut>(`/orders/${orderId}/cancel`);
}

/** Does the code work for this event? Does not use it up; the discount is set at checkout. */
export function checkPromoCode(eventId: string, code: string): Promise<PromoCheckOut> {
  return apiClient.post<PromoCheckOut>(`/events/${eventId}/promo-codes/check`, { code });
}

/**
 * Code behind a campaign QR link (`/events/{id}?promo=<token>`). 404/409 are final
 * (unknown, expired, used up), so they are not retried.
 */
export function usePromoQr(token: string | null) {
  return useQuery({
    queryKey: ["promo-qr", token],
    queryFn: () => apiClient.get<PromoQrOut>(`/promo-qr/${encodeURIComponent(token ?? "")}`),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
  });
}
