import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { CampaignCreate, CampaignOut, CodeCreate, CodeOut, CodeUpdate } from "@/lib/api/types";

// Under the organizer's event key, so the organizer feature's own invalidation
// (["organizer"]) refreshes these too.
export const promoKeys = {
  campaigns: (eventId: string) => ["organizer", "event", eventId, "campaigns"] as const,
  codes: (eventId: string, campaignId: string) =>
    ["organizer", "event", eventId, "campaigns", campaignId, "codes"] as const,
  // Outside ["organizer"] on purpose: a picture of a fixed link never changes, so the
  // organizer's "refetch everything" after an edit should not download it again.
  qrPng: (eventId: string, campaignId: string, codeId: string) =>
    ["promo-qr-png", eventId, campaignId, codeId] as const,
};

const campaignsPath = (eventId: string) => `/events/${eventId}/campaigns`;
const codesPath = (eventId: string, campaignId: string) =>
  `${campaignsPath(eventId)}/${campaignId}/codes`;

/** Campaigns of my event (owner only; anyone else gets 404). */
export function useCampaigns(eventId: string) {
  return useQuery({
    queryKey: promoKeys.campaigns(eventId),
    queryFn: () => apiClient.get<CampaignOut[]>(campaignsPath(eventId)),
  });
}

export function useCreateCampaign(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CampaignCreate) =>
      apiClient.post<CampaignOut>(campaignsPath(eventId), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: promoKeys.campaigns(eventId) }),
  });
}

/** Codes of one campaign with their status as of now and how many times each was used. */
export function useCodes(eventId: string, campaignId: string) {
  return useQuery({
    queryKey: promoKeys.codes(eventId, campaignId),
    queryFn: () => apiClient.get<CodeOut[]>(codesPath(eventId, campaignId)),
  });
}

/** No `code` (or null): the server makes one up. A custom code is stored upper-case. */
export function useCreateCode(eventId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CodeCreate) => apiClient.post<CodeOut>(codesPath(eventId, campaignId), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: promoKeys.codes(eventId, campaignId) }),
  });
}

/** The organizer's switch. Disabling always works; enabling is refused on a closed event. */
export function useSetCodeStatus(eventId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ codeId, status }: { codeId: string; status: CodeUpdate["status"] }) =>
      apiClient.patch<CodeOut>(`${codesPath(eventId, campaignId)}/${codeId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: promoKeys.codes(eventId, campaignId) }),
  });
}

/**
 * The campaign QR as a PNG. It needs the Bearer token, so it cannot be a plain <img src>:
 * it is downloaded as a Blob, and only once the QR is opened.
 */
export function useCodeQrPng(eventId: string, campaignId: string, codeId: string, enabled: boolean) {
  return useQuery({
    queryKey: promoKeys.qrPng(eventId, campaignId, codeId),
    queryFn: () => apiClient.getBlob(`${codesPath(eventId, campaignId)}/${codeId}/qr.png`),
    enabled,
    staleTime: Infinity,
  });
}

/** What the campaign QR leads to; a phone camera opens the event page with the code. */
export function promoLink(eventId: string, qrToken: string): string {
  return `${window.location.origin}/events/${eventId}?promo=${encodeURIComponent(qrToken)}`;
}
