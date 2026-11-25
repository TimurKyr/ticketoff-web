import { ApiError } from "@/lib/api/client";
import type { MessageKey } from "@/lib/i18n";

/** As the API (R-12): PNG / JPEG / WebP up to 5 MB. The server checks the content too. */
export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const COVER_ACCEPT = COVER_TYPES.join(",");

/** Why a chosen file can't be a cover, or null when it may be sent. */
export function checkCoverFile(file: { type: string; size: number }): MessageKey | null {
  if (file.size === 0) return "org.cover.err.empty";
  if (!(COVER_TYPES as readonly string[]).includes(file.type)) return "org.cover.err.type";
  if (file.size > COVER_MAX_BYTES) return "org.cover.err.size";
  return null;
}

/** Text for a failed upload / removal by status (the API's `detail` is in English). */
export function coverErrorKey(error: unknown): MessageKey {
  if (!(error instanceof ApiError)) return "common.networkError";
  switch (error.status) {
    case 404:
      return "org.cover.err.notFound";
    case 409:
      return "org.cover.err.closed";
    case 413:
      return "org.cover.err.size";
    case 422:
      return "org.cover.err.type";
    default:
      return "common.error";
  }
}
