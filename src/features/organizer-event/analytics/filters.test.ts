import { describe, expect, it } from "vitest";

import { analyticsQuery, isReversed, NO_FILTERS } from "./filters";

describe("analyticsQuery", () => {
  it("is empty without filters", () => {
    expect(analyticsQuery(NO_FILTERS)).toBe("");
  });

  it("sends only what is set", () => {
    expect(analyticsQuery({ from_date: "2026-11-01", to_date: "" })).toBe("?from_date=2026-11-01");
    expect(analyticsQuery({ from_date: "", to_date: "2026-11-30", ticket_type_id: "t1" })).toBe(
      "?to_date=2026-11-30&ticket_type_id=t1"
    );
    expect(analyticsQuery({ from_date: "2026-11-01", to_date: "2026-11-30", ticket_type_id: "" })).toBe(
      "?from_date=2026-11-01&to_date=2026-11-30"
    );
  });

  it("leaves out a half-typed day", () => {
    expect(analyticsQuery({ from_date: "2026-1", to_date: "" })).toBe("");
  });
});

describe("isReversed", () => {
  it("is true only when both days are set and from is after to", () => {
    expect(isReversed({ from_date: "2026-11-30", to_date: "2026-11-01" })).toBe(true);
    expect(isReversed({ from_date: "2026-11-01", to_date: "2026-11-01" })).toBe(false);
    expect(isReversed({ from_date: "2026-11-30", to_date: "" })).toBe(false);
  });
});
