import { describe, expect, it } from "vitest";

import { orderSummary } from "./summary";

const lines = [
  { id: "a", name: "Партер", quantity: 2, price_kzt: 6000 },
  { id: "b", name: "Балкон", quantity: 1, price_kzt: 3500 },
  { id: "c", name: "VIP", quantity: 0, price_kzt: 20000 },
];

describe("orderSummary (FE-22 #6)", () => {
  it("sums the picked tickets and skips types with no quantity", () => {
    const s = orderSummary(lines, null);
    expect(s.lines.map((l) => [l.id, l.sum_kzt])).toEqual([
      ["a", 12000],
      ["b", 3500],
    ]);
    expect(s.subtotal_kzt).toBe(15500);
    expect(s.discount_kzt).toBeNull();
    expect(s.total_kzt).toBe(15500);
  });

  it("takes the checked promo discount off the total", () => {
    const s = orderSummary(lines, 1550);
    expect(s.discount_kzt).toBe(1550);
    expect(s.total_kzt).toBe(13950);
  });

  it("never goes below zero and ignores a zero discount", () => {
    expect(orderSummary(lines, 99999).total_kzt).toBe(0);
    expect(orderSummary(lines, 0).discount_kzt).toBeNull();
  });
});
