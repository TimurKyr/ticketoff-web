import { QueryClient } from "@tanstack/react-query";

// TODO (Frontend): tune defaults (staleTime, retry, refetchOnWindowFocus)
// once real API latency/rate limits are known.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
