import { describe, expect, it, vi } from "vitest";

import { cleanLocation, cleanReferrer, createAnalytics, isCleanLocation, sanitizeParams } from "./analytics";

const EVENT = "3f2b8c1e-5d4a-4b7e-9c2f-1a2b3c4d5e6f";
const ORDER = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const ID = "G-C41HW7NWVK";

function fakeWindow(href = "https://ticketoff.store/") {
  const appendChild = vi.fn();
  const win = {
    location: { href },
    document: { createElement: () => ({}) as HTMLScriptElement, head: { appendChild }, referrer: "" },
    dataLayer: undefined as unknown[] | undefined,
  };
  return { win: win as unknown as Window & { dataLayer?: unknown[] }, appendChild };
}

/** The data layer as plain arrays: ["event", "purchase", {...}] */
const hits = (win: { dataLayer?: unknown[] }) => (win.dataLayer ?? []).map((a) => Array.from(a as IArguments));
const events = (win: { dataLayer?: unknown[] }) => hits(win).filter((hit) => hit[0] === "event");

describe("createAnalytics", () => {
  it("does not load gtag.js without a measurement ID", () => {
    for (const id of [undefined, "", "  ", "UA-123"]) {
      const { win, appendChild } = fakeWindow();
      const analytics = createAnalytics(id, win);
      analytics.start();
      analytics.pageView("ticketoff");
      analytics.track("view_item", { item_id: EVENT });
      expect(analytics.enabled).toBe(false);
      expect(appendChild).not.toHaveBeenCalled();
      expect(win.dataLayer).toBeUndefined();
    }
  });

  it("loads gtag.js once with an ID: IP anonymised, no User-ID, no auto page_view", () => {
    const { win, appendChild } = fakeWindow();
    const analytics = createAnalytics(ID, win);
    analytics.start();
    analytics.start();
    analytics.pageView();
    analytics.pageView();
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(appendChild.mock.calls[0][0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${ID}`);
    const config = hits(win).find((hit) => hit[0] === "config")!;
    expect(config[2]).toMatchObject({ anonymize_ip: true, send_page_view: false, allow_google_signals: false });
    expect(JSON.stringify(hits(win))).not.toContain("user_id");
  });

  it("waits with gtag.js until the address has no token or order id", () => {
    const { win, appendChild } = fakeWindow(`https://ticketoff.store/events/${EVENT}?promo=tok123`);
    const analytics = createAnalytics(ID, win);
    analytics.start();
    analytics.pageView();
    analytics.track("view_item", { item_id: EVENT });
    expect(appendChild).not.toHaveBeenCalled();

    // The token leaves the URL: same page, now clean, so gtag.js loads and counts it.
    win.location.href = `https://ticketoff.store/events/${EVENT}`;
    analytics.pageView();
    expect(appendChild).toHaveBeenCalledTimes(1);
  });

  it("queues hits while the address has an order id, with cleaned addresses", () => {
    const { win, appendChild } = fakeWindow(`https://ticketoff.store/events/${EVENT}?promo=tok123`);
    const analytics = createAnalytics(ID, win);
    analytics.start();
    analytics.pageView();
    analytics.track("view_item", { item_id: EVENT });

    win.location.href = `https://ticketoff.store/orders/${ORDER}`;
    analytics.pageView();
    expect(appendChild).not.toHaveBeenCalled();

    win.location.href = "https://ticketoff.store/tickets";
    analytics.pageView();
    analytics.pageView(); // a redirect or a re-render on the same page is not a second view
    expect(appendChild).toHaveBeenCalledTimes(1);
    // Queued hits carry cleaned addresses; the current page is counted by gtag.js on load.
    expect(events(win).map((hit) => [hit[1], (hit[2] as { page_location: string }).page_location])).toEqual([
      ["view_item", `https://ticketoff.store/events/${EVENT}`],
      ["page_view", `https://ticketoff.store/events/${EVENT}`],
      ["page_view", "https://ticketoff.store/orders/:id"],
    ]);
    expect(JSON.stringify(hits(win))).not.toContain("tok123");
    expect(JSON.stringify(hits(win))).not.toContain(ORDER);
  });

  it("track() sends only whitelisted fields and a cleaned page address", () => {
    const { win } = fakeWindow(`https://ticketoff.store/orders/${ORDER}?x=1`);
    const analytics = createAnalytics(ID, win);
    analytics.start();
    analytics.track("purchase", {
      currency: "KZT",
      value: 9000,
      quantity: 2,
      transaction_id: ORDER,
      order_id: ORDER,
      email: "buyer@example.com",
      name: "Айгерім",
      phone: "+77010000000",
      ticket_ids: ["t1"],
    });
    expect(events(win).at(-1)).toEqual([
      "event",
      "purchase",
      { currency: "KZT", value: 9000, quantity: 2, page_location: "https://ticketoff.store/orders/:id" },
    ]);
  });
});

describe("sanitizeParams", () => {
  it("drops unknown keys, objects and email-like strings", () => {
    expect(
      sanitizeParams("campaign_open", {
        campaign_source: "campaign_qr",
        campaign_id: "a@b.kz",
        promo_code: "SUMMER10",
        discount: 10,
        item_id: { nested: true },
      })
    ).toEqual({ campaign_source: "campaign_qr" });
  });
});

describe("cleanLocation", () => {
  it("keeps event ids and utm_*, drops promo tokens, other ids and the hash", () => {
    expect(
      cleanLocation(
        `https://ticketoff.store/events/${EVENT}?promo=tok123&utm_source=campaign_qr&utm_campaign=${ORDER}#x`
      )
    ).toBe(`https://ticketoff.store/events/${EVENT}?utm_source=campaign_qr&utm_campaign=${ORDER}`);
    expect(cleanLocation(`https://ticketoff.store/support/cases/${ORDER}`)).toBe(
      "https://ticketoff.store/support/cases/:id"
    );
    expect(cleanLocation("https://ticketoff.store/verify-email?token=secret")).toBe(
      "https://ticketoff.store/verify-email"
    );
  });

  it("isCleanLocation and cleanReferrer", () => {
    expect(isCleanLocation(`https://ticketoff.store/events/${EVENT}?utm_source=campaign_qr`)).toBe(true);
    expect(isCleanLocation("https://ticketoff.store/organizer?tab=past&page=2")).toBe(true);
    expect(isCleanLocation(`https://ticketoff.store/events/${EVENT}?promo=x`)).toBe(false);
    expect(isCleanLocation(`https://ticketoff.store/orders/${ORDER}`)).toBe(false);
    expect(cleanReferrer("https://mail.example.com/inbox/123", "https://ticketoff.store/")).toBe(
      "https://mail.example.com/"
    );
    expect(cleanReferrer(`https://ticketoff.store/orders/${ORDER}`, "https://ticketoff.store/")).toBe(
      "https://ticketoff.store/orders/:id"
    );
  });
});
