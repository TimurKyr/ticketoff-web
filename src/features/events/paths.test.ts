import { describe, expect, it } from "vitest";

import { eventPath, slugRedirect } from "./paths";

const ID = "b597d435-f7d0-4a60-96b8-b33ca55d2f5c";
const SLUG = "dzhaz-vecher-almaty";

describe("eventPath", () => {
  it("links by slug when the event has one", () => {
    expect(eventPath({ id: ID, slug: SLUG })).toBe(`/events/${SLUG}`);
  });

  it("links by id when there is no slug (private events, not loaded yet)", () => {
    expect(eventPath({ id: ID, slug: null })).toBe(`/events/${ID}`);
    expect(eventPath({ id: ID })).toBe(`/events/${ID}`);
    expect(eventPath({ id: ID, slug: "" })).toBe(`/events/${ID}`);
  });
});

describe("slugRedirect", () => {
  it("moves an id link to the slug, keeping the query and the hash", () => {
    const search = "?promo=tok123&utm_source=campaign_qr&utm_campaign=c1";
    expect(slugRedirect(ID, { id: ID, slug: SLUG }, search, "#tickets")).toBe(
      `/events/${SLUG}${search}#tickets`
    );
    expect(slugRedirect(ID.toUpperCase(), { id: ID, slug: SLUG })).toBe(`/events/${SLUG}`);
  });

  it("stays when already on the slug", () => {
    expect(slugRedirect(SLUG, { id: ID, slug: SLUG }, "?promo=x")).toBeNull();
  });

  it("stays on the id when the event has no slug (private)", () => {
    expect(slugRedirect(ID, { id: ID, slug: null }, "?promo=x")).toBeNull();
  });

  it("never moves a key that is not an id", () => {
    expect(slugRedirect("old-slug", { id: ID, slug: SLUG })).toBeNull();
  });
});
