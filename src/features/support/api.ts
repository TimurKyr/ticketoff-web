import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  CaseCreate,
  CaseDetailOut,
  CasePage,
  MessageOut,
  SupportKind,
  SupportStatus,
  SupportStatusUpdate,
} from "@/lib/api/types";

export const SUPPORT_PAGE_SIZE = 20;
/** How often an open thread checks for new messages (only while the tab is visible). */
export const THREAD_POLL_MS = 10_000;

export const supportKeys = {
  all: ["support"] as const,
  /** Cases I opened (any filter/page). */
  myCases: ["support", "cases"] as const,
  myCasesPage: (status: SupportStatus | null, page: number) =>
    ["support", "cases", status ?? "all", page] as const,
  /** Cases I handle (any filter/page). */
  inbox: ["support", "inbox"] as const,
  inboxPage: (status: SupportStatus | null, kind: SupportKind | null, page: number) =>
    ["support", "inbox", status ?? "all", kind ?? "all", page] as const,
  case: (id: string) => ["support", "case", id] as const,
};

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  return search.toString();
}

/** Cases I opened, newest first. `page` starts at 1. */
export function useMyCases(status: SupportStatus | null, page: number) {
  return useQuery({
    queryKey: supportKeys.myCasesPage(status, page),
    queryFn: () =>
      apiClient.get<CasePage>(
        `/support/cases?${query({ status, limit: SUPPORT_PAGE_SIZE, offset: (page - 1) * SUPPORT_PAGE_SIZE })}`
      ),
    // Keep the previous page on screen only while paging within the same filter.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === (status ?? "all") ? previous : undefined,
  });
}

/**
 * Cases I handle, oldest first: my events' attendee cases (organizer), or every case
 * (platform admin). Anyone else gets 403.
 */
export function useInbox(status: SupportStatus | null, kind: SupportKind | null, page: number) {
  return useQuery({
    queryKey: supportKeys.inboxPage(status, kind, page),
    queryFn: () =>
      apiClient.get<CasePage>(
        `/support/inbox?${query({ status, kind, limit: SUPPORT_PAGE_SIZE, offset: (page - 1) * SUPPORT_PAGE_SIZE })}`
      ),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === (status ?? "all") && previousQuery?.queryKey[3] === (kind ?? "all")
        ? previous
        : undefined,
  });
}

/**
 * One case with its messages; 404 for anyone who is neither its opener nor a handler.
 * With `poll`, it is fetched again every THREAD_POLL_MS while the tab is visible
 * (React Query skips background tabs by default).
 */
export function useCase(caseId: string, { poll = false }: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: supportKeys.case(caseId),
    queryFn: () => apiClient.get<CaseDetailOut>(`/support/cases/${caseId}`),
    enabled: Boolean(caseId),
    refetchInterval: poll ? THREAD_POLL_MS : false,
  });
}

/** After anything that changes a case: the case itself and every list it appears in. */
function useInvalidateCase(caseId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: supportKeys.case(caseId) }),
      queryClient.invalidateQueries({ queryKey: supportKeys.myCases }),
      queryClient.invalidateQueries({ queryKey: supportKeys.inbox }),
    ]);
}

/** A reply. It may change the status too (a customer reply reopens a resolved case). */
export function useReply(caseId: string) {
  const invalidate = useInvalidateCase(caseId);
  return useMutation({
    mutationFn: (body: string) =>
      apiClient.post<MessageOut>(`/support/cases/${caseId}/messages`, { body }),
    onSuccess: invalidate,
  });
}

/** Take the case (handlers). 409 when someone else has it, unless I am a platform admin. */
export function useAssignCase(caseId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCase(caseId);
  return useMutation({
    mutationFn: () => apiClient.post<CaseDetailOut>(`/support/cases/${caseId}/assign`),
    onSuccess: (updated) => {
      queryClient.setQueryData(supportKeys.case(caseId), updated);
      return invalidate();
    },
    // 409/403: the page was out of date (e.g. someone else took the case): show the
    // current state now rather than at the next poll.
    onError: () => queryClient.invalidateQueries({ queryKey: supportKeys.case(caseId) }),
  });
}

/** Handlers: in_progress / waiting_customer / resolved. The customer: resolved only. */
export function useSetCaseStatus(caseId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCase(caseId);
  return useMutation({
    mutationFn: (status: SupportStatusUpdate["status"]) =>
      apiClient.patch<CaseDetailOut>(`/support/cases/${caseId}/status`, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(supportKeys.case(caseId), updated);
      return invalidate();
    },
    onError: () => queryClient.invalidateQueries({ queryKey: supportKeys.case(caseId) }),
  });
}

export function useOpenCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CaseCreate) => apiClient.post<CaseDetailOut>("/support/cases", payload),
    onSuccess: (created) => {
      // The response is the full case: the case page can show it without another request.
      queryClient.setQueryData(supportKeys.case(created.id), created);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: supportKeys.myCases }),
        queryClient.invalidateQueries({ queryKey: supportKeys.inbox }),
      ]);
    },
  });
}
