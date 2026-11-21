import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { resendVerificationEmail } from "../api";
import { useAuth } from "../hooks/useAuth";

/** The backend sends at most one verification email per minute (registration counts). */
const RESEND_COOLDOWN_S = 60;

// The cooldown end is kept for the tab, so leaving the page (or reloading) does not reset it.
const cooldownKey = (userId: string) => `ticketoff.verifyResendUntil.${userId}`;

function readCooldown(userId: string | undefined): number | null {
  if (!userId) return null;
  try {
    const until = Number(window.sessionStorage.getItem(cooldownKey(userId)));
    return Number.isFinite(until) && until > Date.now() ? until : null;
  } catch {
    return null; // storage blocked: the cooldown just lives in memory
  }
}

function saveCooldown(userId: string | undefined, until: number): void {
  if (!userId) return;
  try {
    window.sessionStorage.setItem(cooldownKey(userId), String(until));
  } catch {
    // storage blocked: ignore
  }
}

/** Kept untranslated so the text follows a language switch. */
type Notice =
  | { tone: "success" | "error"; key: MessageKey; seconds?: number }
  | { tone: "error"; error: unknown }
  | null;

/**
 * "Send the email again" for the logged-in user. After a send, and after a 429, the button
 * stays off until the cooldown ends. On 429 the wait comes from `Retry-After` when the
 * browser can read it, else a generic "in about a minute".
 */
export function ResendVerificationButton() {
  const { t } = useI18n();
  const { user, refresh } = useAuth();
  const userId = user?.id;
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() =>
    readCooldown(userId)
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cooldownUntil === null) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownUntil) setCooldownUntil(null);
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const secondsLeft =
    cooldownUntil === null ? 0 : Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  async function send() {
    setSending(true);
    setNotice(null);
    try {
      await resendVerificationEmail();
      setNotice({ tone: "success", key: "verifyEmail.resend.sent" });
      startCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setNotice(
          err.retryAfter !== null
            ? { tone: "error", key: "verifyEmail.resend.tooSoon", seconds: err.retryAfter }
            : { tone: "error", key: "verifyEmail.resend.tooSoonMinute" }
        );
        startCooldown(err.retryAfter ?? RESEND_COOLDOWN_S);
      } else if (err instanceof ApiError && err.status === 409) {
        // Verified meanwhile (e.g. the link was opened in another tab): re-read /auth/me.
        await refresh();
      } else {
        setNotice({ tone: "error", error: err });
      }
    } finally {
      setSending(false);
    }
  }

  function startCooldown(seconds: number) {
    const start = Date.now();
    const until = start + seconds * 1000;
    setNow(start);
    setCooldownUntil(until);
    saveCooldown(userId, until);
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {notice && (
        <Alert tone={notice.tone}>
          {"error" in notice
            ? errorMessage(notice.error, t)
            : t(notice.key).replace("{seconds}", String(notice.seconds ?? ""))}
        </Alert>
      )}
      <Button
        type="button"
        variant="secondary"
        onClick={send}
        disabled={sending || secondsLeft > 0}
      >
        {sending
          ? t("common.loading")
          : secondsLeft > 0
            ? t("verifyEmail.resend.wait").replace("{seconds}", String(secondsLeft))
            : t("verifyEmail.resend.button")}
      </Button>
    </div>
  );
}
