import type { MessageKey } from "@/lib/i18n";

import { ApiError } from "./client";

// FE-8: organizer promo campaigns/codes and support cases.
// ("Promo code not found", "Order not found" and "Ticket not found" are mapped by FE-6.)
const FE8_DETAILS: Record<string, MessageKey> = {
  "Campaign not found": "err.campaignNotFound",
  "Promo campaigns and codes are closed for this event": "err.promoClosed",
  "This promo code is not available, choose another": "err.codeTaken",
  "Could not generate a free code, try again": "err.codeGenerateFailed",
  "A percent discount cannot be more than 100": "err.percentOver100",
  "starts_at must be before ends_at": "err.campaignDates",
  "Support case not found": "support.case.notFound",
  "This case is already taken by someone else": "err.caseTaken",
  "Only a handler of this case can take it": "err.caseNotHandler",
  "You can only mark your own case as resolved": "err.caseOnlyResolve",
  "Only organizers and platform admins have a support inbox": "err.noInbox",
  "An attendee case needs an event_id, order_id or ticket_id": "err.caseNeedsEvent",
  "The event, order and ticket given belong to different events": "err.caseMixedEvents",
  "Organizer account required": "err.organizerRequired",
};

/** Backend `detail` strings that have a translated message. */
const KNOWN_DETAILS: Record<string, MessageKey> = {
  ...FE8_DETAILS,
  "Incorrect email or password": "auth.login.invalid",
  "Email already registered": "auth.register.emailTaken",
  "Organizer profile already exists": "account.becomeOrganizer.exists",
  "Event has already started": "err.eventStarted",
  "Registration has not opened yet": "err.regNotOpen",
  "Registration is closed": "err.regClosed",
  "Not enough capacity left": "err.noCapacity",
  "Only a draft event can be published": "err.publishNotDraft",
  "Add at least one visible ticket type before publishing": "err.publishNoTickets",
  "An event that has already ended cannot be published": "err.publishEnded",
  "Only a published event can be unpublished": "err.unpublishNotPublished",
  "An event with orders cannot be unpublished; cancel it instead": "err.unpublishHasOrders",
  "Venue does not exist": "err.venueMissing",
  "Cannot change kind after tickets have been sold": "err.kindLocked",
  "end_at must be later than start_at": "err.endBeforeStart",
  "registration_closes_at must not be later than start_at": "err.regClosesAfterStart",
  "registration_closes_at must not be earlier than registration_opens_at": "err.regClosesBeforeOpens",
  "max_per_order cannot exceed quantity_total": "err.maxPerOrderOverQuantity",
  "sales_start_at must be before sales_end_at": "err.salesOrder",
  "Free ticket types must have price_kzt = 0": "err.freePrice",
  "Paid ticket types must have price_kzt > 0": "err.paidPrice",
  "Event not found": "events.notFound",
  "Use checkout for paid tickets": "err.useCheckout",
  "Use registration for free tickets": "err.useRegistration",
  "This event uses seat selection": "err.seatSelection",
  "Paid ticket sales are not active for this event": "err.paidNotActive",
  "Ticket type not found": "err.ticketTypeNotFound",
  "Order not found": "err.orderNotFound",
  "Order is already cancelled": "err.orderCancelled",
  "Order is already refunded": "err.orderRefunded",
  "Paid orders are refunded by the organizer": "err.paidRefundedByOrganizer",
  "Only the buyer can cancel a pending checkout": "err.onlyBuyerCancels",
  "A ticket of this order was already used": "err.ticketUsed",
  "Order cannot be paid": "err.orderNotPayable",
  "Checkout expired, start again": "err.checkoutExpired",
  "Ticket not found": "err.ticketNotFound",
  "Ticket is no longer valid": "err.ticketInvalid",
  "Order is not confirmed": "err.orderNotConfirmed",
  "Event was cancelled": "err.eventCancelled",
  "Promo code not found": "err.promoNotFound",
  "This promo code is disabled": "err.promoDisabled",
  "This promo code is not active yet": "err.promoNotActive",
  "This promo code has expired": "err.promoExpired",
  "This promo code has been fully used": "err.promoUsedUp",
  "Promo QR not found": "err.promoQrNotFound",
  "This promo code gives no discount on this order": "err.promoNoDiscount",
  "Invalid or expired verification link": "verifyEmail.invalid",
  "Email is already verified": "verifyEmail.alreadyVerified",
};

/** Backend messages with values inside: pattern → translated text with $1, $2. */
const PATTERNS: [RegExp, MessageKey][] = [
  [/^Not enough tickets left for (.+)$/, "err.notEnoughTickets"],
  [/^At most (\d+) (.+) tickets per order$/, "err.maxPerOrder"],
  [/^Sales for (.+) have not started$/, "err.salesNotStarted"],
  [/^Sales for (.+) have ended$/, "err.salesEnded"],
  [/^A (\w+) event cannot be cancelled$/, "err.cannotCancel"],
  [/^Event is (\w+) and can no longer be changed$/, "err.eventClosed"],
  [/^Capacity \((\d+)\) is below the total ticket quantity \((\d+)\)$/, "err.capacityBelowTypes"],
  [/^Capacity \((\d+)\) is below tickets already sold \((\d+)\)$/, "err.capacityBelowSold"],
  [/^(.+) cannot be changed once the event has orders$/, "err.fieldsLocked"],
  [/^Ticket types cannot be changed on a (\w+) event$/, "err.ticketTypesClosed"],
  [/^Paid sales cannot be activated on a (\w+) event$/, "err.activationClosed"],
  [/^quantity_total cannot be lower than tickets already sold \((\d+)\)$/, "err.quantityBelowSold"],
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
          // Pydantic prefixes model-level errors with "Value error, ".
          const msg = translateDetail((issue.msg ?? "").replace(/^Value error, /, ""), t);
          const field = issue.loc?.filter((p) => p !== "body").join(".");
          return field ? `${field}: ${msg}` : msg;
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
