/**
 * Google Analytics 4 without personal data (ТЗ §8, R-83).
 *
 * - gtag.js is loaded only when VITE_GA4_ID is set (the production build); local dev, CI
 *   and tests have no ID, so nothing is loaded and track() does nothing.
 * - No User-ID, IP anonymised, Google signals and ad personalisation off.
 * - Each event has a whitelist of parameters; anything else is dropped before it reaches
 *   gtag. Strings that look like an email are dropped too.
 * - Every hit carries a cleaned page_location: no query except utm_* and a few filters, no
 *   hash, and ids in the path replaced by ":id" (except event ids), so promo tokens,
 *   verify-email tokens and order or case ids never leave the browser. gtag.js itself is
 *   loaded only on a clean address (see isCleanLocation).
 */

export type AnalyticsEvent = "page_view" | "view_item" | "begin_checkout" | "purchase" | "campaign_open";

type Value = string | number | boolean;
export type AnalyticsParams = Record<string, unknown>;

const ALLOWED: Record<AnalyticsEvent, readonly string[]> = {
  page_view: ["page_title"],
  // The event (a "product" in GA terms) and its category.
  view_item: ["item_id", "item_category"],
  // Amounts in KZT and how many tickets; never an order id.
  begin_checkout: ["currency", "value", "quantity", "ticket_kind"],
  purchase: ["currency", "value", "quantity", "ticket_kind"],
  // The campaign id only: not the promo code, its QR token or the discount.
  campaign_open: ["campaign_source", "campaign_id", "item_id"],
};

// Campaign tags and the harmless tab/page/status filters of a few pages.
const KEPT_QUERY = ["utm_source", "utm_medium", "utm_campaign", "tab", "page", "status"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_STRING = 100;

/** Only the whitelisted parameters of this event, as plain short values. */
export function sanitizeParams(event: AnalyticsEvent, params: AnalyticsParams = {}): Record<string, Value> {
  const out: Record<string, Value> = {};
  for (const key of ALLOWED[event]) {
    const value = params[key];
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
    else if (typeof value === "string" && value !== "" && !value.includes("@")) {
      out[key] = value.slice(0, MAX_STRING);
    }
  }
  return out;
}

/** The page address without anything that could identify a person, an order or a code. */
export function cleanLocation(href: string): string {
  const url = new URL(href);
  const segments = url.pathname.split("/");
  const path = segments
    .map((segment, i) => (UUID.test(segment) && segments[i - 1] !== "events" ? ":id" : segment))
    .join("/");
  const query = new URLSearchParams();
  for (const key of KEPT_QUERY) {
    const value = url.searchParams.get(key);
    if (value && !value.includes("@")) query.set(key, value.slice(0, MAX_STRING));
  }
  const search = query.toString();
  return `${url.origin}${path}${search ? `?${search}` : ""}`;
}

/** An outside referrer is kept as its origin only; one of our own pages is cleaned. */
export function cleanReferrer(referrer: string, href: string): string {
  if (!referrer) return "";
  try {
    const from = new URL(referrer);
    return from.origin === new URL(href).origin ? cleanLocation(referrer) : `${from.origin}/`;
  } catch {
    return "";
  }
}

/**
 * Whether gtag.js may load on this address. On load it sends a page_view of its own with the
 * raw address (it ignores send_page_view and page_location), so it waits for a page with no
 * token, promo code or order id in the URL.
 */
export function isCleanLocation(href: string): boolean {
  const url = new URL(href);
  const segments = url.pathname.split("/");
  const pathOk = segments.every((segment, i) => !UUID.test(segment) || segments[i - 1] === "events");
  const queryOk = [...url.searchParams].every(([key, value]) => KEPT_QUERY.includes(key) && !value.includes("@"));
  return pathOk && queryOk;
}

type Gtag = (...args: unknown[]) => void;
type AnalyticsWindow = Pick<Window, "document" | "location"> & { dataLayer?: unknown[]; gtag?: Gtag };

export interface Analytics {
  readonly enabled: boolean;
  /** Sets up the gtag queue. Without a measurement ID it does nothing. */
  start(): void;
  /**
   * On every route change. Loads gtag.js on the first clean address (it then counts that page
   * itself); after that, sends page_view. Pages seen before are sent with cleaned addresses.
   */
  pageView(title?: string): void;
  track(event: AnalyticsEvent, params?: AnalyticsParams): void;
}

export function createAnalytics(measurementId: string | undefined, win: AnalyticsWindow | undefined): Analytics {
  const id = measurementId?.trim() ?? "";
  const enabled = Boolean(win) && /^G-[A-Z0-9]+$/.test(id);
  let gtag: Gtag | null = null;
  let loaded = false;
  // Cleaned addresses of pages seen before gtag.js could load.
  const waiting: string[] = [];
  // The page counted last, so a redirect or a token leaving the URL is not a second view.
  let counted = "";

  function send(event: AnalyticsEvent, params: Record<string, Value>, pageLocation: string) {
    if (!gtag) return;
    // "set" also covers the automatic hits that follow (scroll, outbound clicks).
    gtag("set", { page_location: pageLocation });
    gtag("event", event, { ...params, page_location: pageLocation });
  }

  function loadIfClean(): boolean {
    if (loaded) return true;
    if (!win || !gtag || !isCleanLocation(win.location.href)) return false;
    loaded = true;
    const here = cleanLocation(win.location.href);
    for (const page of waiting.splice(0)) if (page !== here) send("page_view", {}, page);
    gtag("set", { page_location: here });
    counted = here;
    const script = win.document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    win.document.head.appendChild(script);
    return true;
  }

  return {
    enabled,
    start() {
      if (!enabled || !win || gtag) return;
      const dataLayer = (win.dataLayer = win.dataLayer ?? []);
      // gtag.js reads `arguments` objects from the data layer, not arrays.
      gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        dataLayer.push(arguments);
      };
      win.gtag = gtag;
      gtag("js", new Date());
      gtag("set", { page_referrer: cleanReferrer(win.document.referrer, win.location.href) });
      gtag("config", id, {
        send_page_view: false,
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    },
    pageView(title) {
      if (!gtag || !win) return;
      const here = cleanLocation(win.location.href);
      if (!loaded) {
        if (loadIfClean()) return; // gtag.js counts the current page itself
        if (here !== counted) waiting.push(here);
      } else if (here !== counted) {
        send("page_view", sanitizeParams("page_view", { page_title: title }), here);
      }
      counted = here;
    },
    track(event, params) {
      if (!gtag || !win) return;
      // Queued until gtag.js loads; each hit carries its own cleaned address.
      send(event, sanitizeParams(event, params), cleanLocation(win.location.href));
    },
  };
}

export const analytics = createAnalytics(
  import.meta.env.VITE_GA4_ID,
  typeof window === "undefined" ? undefined : window
);

export const track = (event: AnalyticsEvent, params?: AnalyticsParams) => analytics.track(event, params);

// Campaign QR opens already counted in this tab, so a return from /login is not a second open.
const openedCampaigns = new Set<string>();

/**
 * A visit from a campaign QR: `?promo=<token>` on the event page, or utm_source=campaign_qr.
 * Sends the campaign id from utm_campaign when it is one; never the token or the code.
 */
export function trackCampaignOpen(eventId: string, search: URLSearchParams): void {
  const fromQr = search.has("promo") || search.get("utm_source") === "campaign_qr";
  if (!fromQr) return;
  const campaign = search.get("utm_campaign") ?? "";
  const campaignId = UUID.test(campaign) ? campaign : undefined;
  const key = `${eventId}:${campaignId ?? ""}`;
  if (openedCampaigns.has(key)) return;
  openedCampaigns.add(key);
  track("campaign_open", { campaign_source: "campaign_qr", campaign_id: campaignId, item_id: eventId });
}
