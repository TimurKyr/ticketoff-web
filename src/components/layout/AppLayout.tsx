import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { AuthProvider } from "@/features/auth";
import { analytics } from "@/lib/analytics";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { pageFrame } from "./headerNav";

/** One GA page_view per route change (the SPA never reloads the page). */
function usePageViews(pathname: string, search: string) {
  useEffect(() => {
    analytics.pageView(document.title);
  }, [pathname, search]);
}

export function AppLayout() {
  const { pathname, search } = useLocation();
  usePageViews(pathname, search);
  const frame = pageFrame(pathname);
  return (
    <AuthProvider>
      {/* One warm background for every page (body has it too); content sits on white cards. */}
      <div className="flex min-h-screen flex-col bg-[#F2F1EE]">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {frame === "bare" ? (
            <Outlet />
          ) : frame === "auth" ? (
            <div className="card mx-auto w-full max-w-md px-5 py-6 sm:mt-4 sm:px-8 sm:py-8">
              <Outlet />
            </div>
          ) : (
            <div className="card px-4 py-5 sm:px-6 sm:py-6">
              <Outlet />
            </div>
          )}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
