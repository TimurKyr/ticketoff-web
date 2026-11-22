import { useEffect } from "react";

import { useI18n } from "@/lib/i18n";

import { useAuth } from "../hooks/useAuth";
import { ResendVerificationButton } from "./ResendVerificationButton";

export type VerifyEmailReason = "account" | "buy" | "publish";

const TITLE = {
  account: "account.emailNotVerified",
  buy: "verifyEmail.required.buy",
  publish: "verifyEmail.required.publish",
} as const;

/**
 * "Confirm your email" box with the resend button, for a logged-in user whose email is not
 * confirmed. Buying, free registration and publishing need it (403 EMAIL_NOT_VERIFIED).
 *
 * Shown when /auth/me says `email_verified: false`, or with `force` after the server refused
 * an action (the cached /auth/me may be out of date). While shown, /auth/me is re-read when
 * the tab gets focus again, so confirming in another tab (the email link) unlocks the page.
 */
export function VerifyEmailNotice({
  reason,
  force = false,
}: {
  reason: VerifyEmailReason;
  force?: boolean;
}) {
  const { t } = useI18n();
  const { user, refresh } = useAuth();
  const visible = !!user && (force || !user.email_verified);

  useEffect(() => {
    if (!visible) return;
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [visible, refresh]);

  if (!visible || !user) return null;
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-amber-600 bg-amber-50 p-4"
    >
      <h2 className="font-semibold text-amber-900">{t(TITLE[reason])}</h2>
      <p className="text-sm text-amber-900">
        {t("verifyEmail.banner.text").replace("{email}", user.email)}
      </p>
      <ResendVerificationButton />
    </div>
  );
}
