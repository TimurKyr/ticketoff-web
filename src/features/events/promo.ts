// Campaign QR links open /events/{id}?promo=<token>. Promo codes (BE-16, FE-8) are not
// in the API yet, so the token is only kept here for the checkout to pick up later.
const key = (eventId: string) => `ticketoff.promo.${eventId}`;

export function savePromoToken(eventId: string, token: string): void {
  try {
    sessionStorage.setItem(key(eventId), token);
  } catch {
    // storage blocked
  }
}

export function getPromoToken(eventId: string): string | null {
  try {
    return sessionStorage.getItem(key(eventId));
  } catch {
    return null;
  }
}
