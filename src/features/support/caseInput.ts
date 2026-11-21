import type { CaseCreate, SupportCategory, SupportKind } from "@/lib/api/types";

/** The API's limit for a message, counted after the spaces around it are dropped. */
export const BODY_MAX = 5000;

/** Same rule as the API: 1–5000 characters once trimmed. Returns the text to send, or null. */
export function validBody(raw: string): string | null {
  const text = raw.trim();
  return text && text.length <= BODY_MAX ? text : null;
}

/** What a new case is about; sent as is, never shown as fields. */
export type CaseContext = Pick<CaseCreate, "event_id" | "order_id" | "ticket_id">;

/** What the user has typed so far; kept by the caller so closing the dialog keeps it. */
export interface CaseDraft {
  category: SupportCategory;
  body: string;
}

/** An empty draft with a sensible first topic for where the form was opened from. */
export function newCaseDraft(kind: SupportKind, context: CaseContext = {}): CaseDraft {
  return { category: defaultCategory(kind, context), body: "" };
}

function defaultCategory(kind: SupportKind, context: CaseContext): SupportCategory {
  if (kind === "organizer") return "other";
  if (context.ticket_id) return "ticket";
  if (context.order_id) return "payment";
  return "event";
}
