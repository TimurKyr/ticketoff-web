import { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import type { MeOut } from "@/lib/api/types";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { useAuth } from "../hooks/useAuth";

export function PageLoader() {
  const { t } = useI18n();
  return (
    <p role="status" className="text-sm text-gray-600">
      {t("common.loading")}
    </p>
  );
}

/** Logged-in users only; others go to /login and come back after it. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, sessionExpired } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, expired: sessionExpired }}
      />
    );
  }
  return <>{children}</>;
}

type Role = "organizer" | "platform_admin";

const allowed: Record<Role, (user: MeOut) => boolean> = {
  organizer: (user) => user.is_organizer,
  platform_admin: (user) => user.system_role === "platform_admin",
};

const forbiddenText: Record<Role, MessageKey> = {
  organizer: "guard.forbidden.organizer",
  platform_admin: "guard.forbidden.admin",
};

/**
 * Organizer pages need `is_organizer`; admin pages need `system_role == platform_admin`.
 * With a list, any one of the roles is enough (e.g. the support inbox).
 */
export function RequireRole({ role, children }: { role: Role | Role[]; children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const roles = Array.isArray(role) ? role : [role];
  // The message names the first role: for ["organizer", "platform_admin"] a regular user
  // can still become an organizer.
  const main = roles[0];
  return (
    <RequireAuth>
      {user && roles.some((r) => allowed[r](user)) ? (
        children
      ) : (
        <section className="max-w-lg">
          <h1 className="text-xl font-semibold mb-2">{t("guard.forbidden.title")}</h1>
          <p className="text-gray-700">{t(forbiddenText[main])}</p>
          {main === "organizer" && (
            <Link to="/account" className="mt-3 inline-block underline">
              {t("guard.toAccount")}
            </Link>
          )}
        </section>
      )}
    </RequireAuth>
  );
}

/**
 * Login/register pages. Once there is a user (already logged in, or just after
 * a successful submit) this is the single place that redirects: back to the page
 * that sent the user to /login, else to `redirectTo`.
 */
export function GuestOnly({
  children,
  redirectTo = "/",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { user, isLoading } = useAuth();
  const from = (useLocation().state as { from?: string } | null)?.from;
  if (user) return <Navigate to={from && from !== "/login" ? from : redirectTo} replace />;
  if (isLoading) return <PageLoader />;
  return <>{children}</>;
}
