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
  const [result, setResult] = useState<Result | null>(token ? null : { status: "invalid" });
  // StrictMode runs effects twice in dev; send each token only once.
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    // Wait for the first /auth/me: a refresh() while it is still loading would reuse that
    // request, which may have read the user before the verification, and keep it unverified.
    if (isLoading || !token || sentFor.current === token) return;
    sentFor.current = token;
    setResult(null);
    verifyEmail(token)
      .then(() => {
        setResult({ status: "success" });
        void refresh(); // email_verified changed on /auth/me
      })
      .catch((err: unknown) => {
        // 422: bad, expired or tampered token (one message for all).
        if (err instanceof ApiError && err.status === 422) setResult({ status: "invalid" });
        else setResult({ status: "error", error: err });
      });
  }, [isLoading, token, refresh]);

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
