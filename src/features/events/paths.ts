/**
 * The public page of an event: /events/{slug} (BE-35, e.g. /events/dzhaz-vecher-almaty), or
 * /events/{id} when the event has no slug (private events never do, so their link can't be
 * guessed). Old /events/{id} links still open: the page moves them to the slug.
 */
export function eventPath(event: { id: string; slug?: string | null }): string {
  return `/events/${event.slug || event.id}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Where /events/{key}{search}{hash} should go instead: the slug address when the page was
 * opened by the event's id and the event has a slug, keeping the query (?promo=, utm_*) and
 * the hash. null when the address is already right.
 */
export function slugRedirect(
  key: string,
  event: { id: string; slug?: string | null },
  search = "",
  hash = ""
): string | null {
  if (!event.slug || key === event.slug || !UUID.test(key)) return null;
  return `${eventPath(event)}${search}${hash}`;
}
