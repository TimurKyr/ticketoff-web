import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { EventOut } from "@/lib/api/types";
import { I18nProvider } from "@/lib/i18n";
import { ru } from "@/lib/i18n/messages";

import { isEventEnded, orderBlock } from "./availability";
import { SalesSuspendedBanner } from "./components/SalesSuspendedBanner";

const NOW = Date.parse("2026-11-24T12:00:00Z");

function event(patch: Partial<EventOut> = {}): EventOut {
  return {
    status: "published",
    sales_suspended: false,
    start_at: "2026-12-01T15:00:00Z",
    end_at: null,
    registration_opens_at: null,
    registration_closes_at: null,
    ...patch,
  } as EventOut;
}

describe("orderBlock (FE-22 #1, #18)", () => {
  it("lets an ordinary published event be bought", () => {
    expect(orderBlock(event(), NOW)).toBeNull();
  });

  it("shows the suspension instead of the forms", () => {
    expect(orderBlock(event({ sales_suspended: true }), NOW)).toBe("suspended");
  });

  it("puts the suspension before the registration window", () => {
    const notOpen = event({ sales_suspended: true, registration_opens_at: "2026-11-28T00:00:00Z" });
    expect(orderBlock(notOpen, NOW)).toBe("suspended");
  });

  it("says cancelled first, even when suspended", () => {
    expect(orderBlock(event({ status: "cancelled", sales_suspended: true }), NOW)).toBe("cancelled");
  });

  it("tells a started event from an ended one", () => {
    expect(orderBlock(event({ start_at: "2026-11-24T10:00:00Z" }), NOW)).toBe("started");
    expect(orderBlock(event({ start_at: "2026-11-20T10:00:00Z" }), NOW)).toBe("ended");
    expect(
      orderBlock(event({ start_at: "2026-11-24T08:00:00Z", end_at: "2026-11-24T11:00:00Z" }), NOW)
    ).toBe("ended");
  });

  it("counts an event without end_at as over half a day after the start", () => {
    expect(isEventEnded({ start_at: "2026-11-24T00:30:00Z", end_at: null }, NOW)).toBe(false);
    expect(isEventEnded({ start_at: "2026-11-23T23:59:00Z", end_at: null }, NOW)).toBe(true);
  });
});

describe("SalesSuspendedBanner", () => {
  const render = (audience: "buyer" | "organizer") =>
    renderToStaticMarkup(
      <I18nProvider>
        <SalesSuspendedBanner audience={audience} />
      </I18nProvider>
    );

  it("tells the buyer, in Russian by default", () => {
    const html = render("buyer");
    expect(html).toContain(ru["events.salesSuspended.title"]);
    expect(html).toContain(ru["events.salesSuspended.buyer"]);
    expect(html).toContain('role="status"');
  });

  it("tells the organizer what it means for them", () => {
    const html = render("organizer");
    expect(html).toContain(ru["events.salesSuspended.organizer"]);
    expect(html).not.toContain(ru["events.salesSuspended.buyer"]);
  });
});
