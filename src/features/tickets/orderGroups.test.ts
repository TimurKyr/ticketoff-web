import { describe, expect, it } from "vitest";

import type { OrderOut } from "@/lib/api/types";

import { groupOrders } from "./orderGroups";

const NOW = Date.parse("2026-11-24T12:00:00Z");
const order = (id: string, event_id: string) => ({ id, event_id }) as OrderOut;
const events = new Map([
  ["far", { start_at: "2026-12-20T15:00:00Z", end_at: null }],
  ["near", { start_at: "2026-11-30T15:00:00Z", end_at: null }],
  ["old", { start_at: "2026-10-01T15:00:00Z", end_at: null }],
  ["older", { start_at: "2026-09-01T15:00:00Z", end_at: "2026-09-01T18:00:00Z" }],
]);

describe("groupOrders (FE-22 #10)", () => {
  it("splits by event date: upcoming nearest first, past most recent first", () => {
    const orders = [order("1", "far"), order("2", "old"), order("3", "near"), order("4", "older")];
    const { upcoming, past } = groupOrders(orders, events, NOW);
    expect(upcoming.map((o) => o.id)).toEqual(["3", "1"]);
    expect(past.map((o) => o.id)).toEqual(["2", "4"]);
  });

  it("keeps an order with an unknown event in upcoming, at the end", () => {
    const { upcoming } = groupOrders([order("x", "loading"), order("1", "far")], events, NOW);
    expect(upcoming.map((o) => o.id)).toEqual(["1", "x"]);
  });
});
