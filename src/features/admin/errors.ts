import { ApiError } from "@/lib/api/client";
import type { MessageKey } from "@/lib/i18n";

/** Human text for a failed admin request (404/409 get their own message). */
export function errorText(err: unknown, t: (key: MessageKey) => string): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return t("admin.err.notFound");
    if (err.status === 409) {
      const detail = typeof err.detail === "string" ? err.detail : "";
      return detail ? `${t("admin.err.conflict")} ${detail}` : t("admin.err.conflict");
    }
    return t("common.error");
  }
  return t("common.networkError");
}
