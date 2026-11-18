// Campaign QR links open /events/{id}?promo=<token>. Promo codes (BE-16, FE-8) are not
// in the API yet, so the token is only kept here for the checkout to pick up later.
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
