// Campaign QR links open /events/{id}?promo=<token>. The token is kept for the tab's
// session (it survives the trip to /login and back) and turned into a promo code with
// GET /promo-qr/{token} before checkout.
const key = (eventId: string) => `ticketoff.promo.${eventId}`;

/** Returns false when the token could not be stored (storage blocked or full). */
export function savePromoToken(eventId: string, token: string): boolean {
  try {
    sessionStorage.setItem(key(eventId), token);
    return sessionStorage.getItem(key(eventId)) === token;
  } catch {
    return false;
  }
}

export function getPromoToken(eventId: string): string | null {
  try {
    return sessionStorage.getItem(key(eventId));
  } catch {
    return null;
  }
}
