import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      // 4xx (not found, forbidden, validation) will not change on retry; network and 5xx may.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});
