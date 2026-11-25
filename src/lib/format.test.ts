import { describe, expect, it } from "vitest";

import { formatDateTime, formatDay, formatKzt, formatPercent, formatShortDateTime } from "./format";

const NBSP = "\u00a0";
// 19:00 in Almaty (UTC+5) on Monday, 7 December 2026.
const ISO = "2026-12-07T14:00:00Z";

describe("format in en", () => {
  it("prices: comma thousands, tenge sign after", () => {
    expect(formatKzt(15000, "en")).toBe(`15,000${NBSP}₸`);
    expect(formatKzt(15000, "ru")).toBe(`15${NBSP}000${NBSP}₸`);
    expect(formatKzt(-2500, "en")).toBe(`−2,500${NBSP}₸`);
  });

  it("dates: en-GB order, 24-hour clock, venue zone", () => {
    expect(formatDateTime(ISO, "en")).toBe(`Mon, 7 December 2026 · 19:00${NBSP}GMT+5`);
    expect(formatDateTime(ISO, "ru")).toBe(`7 декабря 2026, пн · 19:00${NBSP}GMT+5`);
    expect(formatShortDateTime(ISO, "en")).toMatch(/^Mon, 7 Dec( 2026)? · 19:00\u00a0GMT\+5$/);
    expect(formatDay("2026-11-21", "en")).toMatch(/^21\u00a0Nov( 2026)?$/);
  });

  it("percent", () => {
    expect(formatPercent(3, "en")).toBe("3%");
    expect(formatPercent(3, "kk")).toBe(`3${NBSP}%`);
  });
});
