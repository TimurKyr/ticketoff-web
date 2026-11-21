import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/States";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

import { verifyEmail } from "../api";
import { ResendVerificationButton } from "../components/ResendVerificationButton";
import { useAuth } from "../hooks/useAuth";

type Result = { status: "success" } | { status: "invalid" } | { status: "error"; error: unknown };

/**
 * /verify-email?token=… — the link from the verification email (backend
 * `notifications/links.py`). Sends the token once; no login needed.
 */
export function VerifyEmailPage() {
  const { t } = useI18n();
  const { user, isLoading, refresh } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  // Each result belongs to the token it was got for, so a change of ?token= (or its
  // removal) never shows the previous token's answer.
  const [outcome, setOutcome] = useState<{ token: string; result: Result } | null>(null);
  // StrictMode runs effects twice in dev; send each token only once.
  const sentFor = useRef<string | null>(null);
  // The token in the URL right now. A late answer for an older token (the route changed
  // while it was in flight) is dropped: it must not replace the current result or strip
  // the newer token from the address bar.
  const activeToken = useRef(token);
  useEffect(() => {
    activeToken.current = token;
  }, [token]);

  useEffect(() => {
    // Wait for the first /auth/me: a refresh() while it is still loading would reuse that
    // request, which may have read the user before the verification, and keep it unverified.
    if (isLoading || !token || sentFor.current === token) return;
    sentFor.current = token;
    // A dropped answer forgets the send, so coming back to this token sends it again.
    const isStale = () => {
      if (activeToken.current === token) return false;
      if (sentFor.current === token) sentFor.current = null;
      return true;
    };
    verifyEmail(token)
      .then(() => {
        if (isStale()) return;
        setOutcome({ token, result: { status: "success" } });
        void refresh(); // email_verified changed on /auth/me
        // Drop the one-time token from the address bar (history, screenshots). Done on
        // window.history only, so the router still holds the token and the result above
        // stays bound to it; router navigation to a bare /verify-email shows "invalid".
        window.history.replaceState(window.history.state, "", window.location.pathname);
      })
      .catch((err: unknown) => {
        if (isStale()) return;
        // 422: bad, expired or tampered token (one message for all).
        const result: Result =
          err instanceof ApiError && err.status === 422
            ? { status: "invalid" }
            : { status: "error", error: err };
        setOutcome({ token, result });
      });
  }, [isLoading, token, refresh]);

  const result: Result | null = !token
    ? { status: "invalid" }
    : outcome?.token === token
      ? outcome.result
      : null;

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("verifyEmail.title")}</h1>
      {result === null && <Loading />}

      {result?.status === "success" && (
        <>
          <Alert tone="success">{t("verifyEmail.success")}</Alert>
          <Link to={user ? "/account" : "/"} className="self-start font-medium underline">
            {user ? t("verifyEmail.toAccount") : t("verifyEmail.toHome")}
          </Link>
        </>
      )}

      {result?.status === "invalid" && (
        <>
          <Alert tone="error">{t("verifyEmail.invalid")}</Alert>
          {isLoading ? null : user?.email_verified ? (
            <>
              <p className="text-sm text-gray-700">{t("verifyEmail.alreadyVerified")}</p>
              <Link to="/account" className="self-start font-medium underline">
                {t("verifyEmail.toAccount")}
              </Link>
            </>
          ) : user ? (
            <>
              <p className="text-sm text-gray-700">
                {t("verifyEmail.invalid.resendHint").replace("{email}", user.email)}
              </p>
              <ResendVerificationButton />
            </>
          ) : (
            <p className="text-sm text-gray-700">
              {t("verifyEmail.invalid.loginHint")}{" "}
              <Link
                to="/login"
                state={{ from: "/account" }}
                className="font-medium underline"
              >
                {t("nav.login")}
              </Link>
            </p>
          )}
        </>
      )}

      {result?.status === "error" && <Alert tone="error">{errorMessage(result.error, t)}</Alert>}
    </section>
  );
}
