import { describe, expect, it } from "vitest";

import type { NotificationOut } from "@/lib/api/types";

import { badgeText, notificationLink } from "./links";

const item = (type: NotificationOut["type"], payload: NotificationOut["payload"]): NotificationOut => ({
  id: "n1",
  type,
  payload,
  created_at: "2026-11-23T10:00:00Z",
  read_at: null,
});

describe("notificationLink", () => {
  it.each([
    ["order_confirmed", { order_id: "o1" }, "/orders/o1"],
    ["payment_failed", { order_id: "o1", payment_id: "p1" }, "/orders/o1"],
    ["refund_processed", { order_id: "o1", refund_id: "r1", amount_kzt: 5000 }, "/orders/o1"],
    ["support_reply", { case_id: "c1" }, "/support/cases/c1"],
    ["support_status", { case_id: "c1" }, "/support/cases/c1"],
    ["event_updated", { event_id: "e1", fields: ["starts_at"] }, "/events/e1"],
    ["event_cancelled", { event_id: "e1", order_ids: ["o2", "o3"], refund_kzt: 0 }, "/orders/o2"],
    ["event_cancelled", { event_id: "e1", order_ids: [] }, "/events/e1"],
  ] as const)("%s → %s", (type, payload, to) => {
    expect(notificationLink(item(type, payload))).toBe(to);
  });

  it("goes nowhere without the id it needs, or for a type with no page", () => {
    expect(notificationLink(item("order_confirmed", {}))).toBeNull();
    expect(notificationLink(item("support_reply", null))).toBeNull();
    expect(notificationLink(item("account_verification", null))).toBeNull();
  });
});

describe("badgeText", () => {
  it("caps at 9+", () => {
    expect([1, 9, 10, 250].map(badgeText)).toEqual(["1", "9", "9+", "9+"]);
  });
});
