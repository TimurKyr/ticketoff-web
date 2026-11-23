import { describe, expect, it } from "vitest";

import type { EventOut } from "@/lib/api/types";

import { buildRows } from "./rows";

let n = 0;
const ev = (category: string | null, price_from: number | null, day: number): EventOut =>
  ({
    id: `e${(n += 1)}`,
    title: `Event ${n}`,
    category,
    price_from,
    start_at: `2026-12-${String(day).padStart(2, "0")}T14:00:00Z`,
  }) as EventOut;

describe("buildRows", () => {
  it("builds upcoming, free and the two most common categories", () => {
    const events = [
      ev("music", 0, 9), ev("music", 5000, 3), ev("music", 0, 4), ev("music", 100, 5),
      ev("sport", 0, 6), ev("sport", 500, 7), ev("sport", 500, 8),
      ev("education", 700, 1), ev("education", 0, 2), ev("education", null, 10),
      ev("other", 1, 11), ev("other", 1, 12), ev("other", 1, 13), ev("other", 1, 14),
    ];
    const rows = buildRows(events);
    expect(rows.map((r) => (r.kind === "category" ? r.category : r.kind))).toEqual([
      "upcoming",
      "free",
      "music",
      "education", // ties with sport, earlier in the category list
    ]);
    expect(rows[0].events).toHaveLength(8);
    expect(rows[0].events[0].start_at).toBe("2026-12-01T14:00:00Z");
    expect(rows[1].events.every((e) => e.price_from === 0)).toBe(true);
  });

  it("hides short rows but keeps a short upcoming row", () => {
    const rows = buildRows([ev("music", 0, 1), ev("music", 0, 2)]);
    expect(rows.map((r) => r.kind)).toEqual(["upcoming"]);
    expect(buildRows([])).toEqual([]);
  });
});
