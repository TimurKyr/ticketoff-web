import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { OrderOut } from "@/lib/api/types";

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => apiClient.get<OrderOut>(`/orders/${orderId}`),
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["orders", "me"],
    queryFn: () => apiClient.get<OrderOut[]>("/orders/me"),
  });
}

/** GET /tickets/{id}/pdf (A4 ticket from the server) and save it as a file. */
export async function downloadTicketPdf(ticketId: string): Promise<void> {
  const blob = await apiClient.getBlob(`/tickets/${ticketId}/pdf`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ticketoff-${ticketId.slice(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
