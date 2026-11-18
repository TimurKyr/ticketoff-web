import type { MessageKey } from "@/lib/i18n";

import { ApiError } from "./client";

/** Backend `detail` strings that have a translated message. */
const KNOWN_DETAILS: Record<string, MessageKey> = {
  "Incorrect email or password": "auth.login.invalid",
  "Email already registered": "auth.register.emailTaken",
  "Organizer profile already exists": "account.becomeOrganizer.exists",
  "Event has already started": "err.eventStarted",
  "Registration has not opened yet": "err.regNotOpen",
  "Registration is closed": "err.regClosed",
  "Not enough capacity left": "err.noCapacity",
  "Event not found": "events.notFound",
};

/** Backend messages with values inside: pattern → translated text with $1, $2. */
const PATTERNS: [RegExp, MessageKey][] = [
  [/^Not enough tickets left for (.+)$/, "err.notEnoughTickets"],
  [/^Sales for (.+) have not started$/, "err.salesNotStarted"],
  [/^Sales for (.+) have ended$/, "err.salesEnded"],
];

function translateDetail(detail: string, t: (key: MessageKey) => string): string {
  const key = KNOWN_DETAILS[detail];
  if (key) return t(key);
  for (const [pattern, patternKey] of PATTERNS) {
    const match = detail.match(pattern);
    if (match) return t(patternKey).replace(/\$(\d)/g, (_, n) => match[Number(n)] ?? "");
  }
  return detail;
}

interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

/**
 * Human-readable message for an error from apiClient.
 * Errors come as `{"detail": "..."}`; 422 from validation is a list of issues.
 */
export function errorMessage(error: unknown, t: (key: MessageKey) => string): string {
  if (error instanceof ApiError) {
    const detail = error.detail;
    if (typeof detail === "string") return translateDetail(detail, t);
    if (Array.isArray(detail)) {
      const parts = (detail as ValidationIssue[])
        .map((issue) => {
          const field = issue.loc?.filter((p) => p !== "body").join(".");
          return field ? `${field}: ${issue.msg ?? ""}` : (issue.msg ?? "");
        })
        .filter(Boolean);
      if (parts.length) return parts.join("; ");
    }
    return t("common.error");
  }
  if (error instanceof TypeError) {
    // fetch() rejects with TypeError on network/CORS failures
    return t("common.networkError");
  }
  return t("common.error");
}
