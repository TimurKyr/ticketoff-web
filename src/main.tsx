import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router-dom";

import { I18nProvider } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/router";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </I18nProvider>
  </React.StrictMode>
);
