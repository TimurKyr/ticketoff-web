import { describe, expect, it } from "vitest";

import { formatCardDate } from "./cardDate";

describe("formatCardDate", () => {
  it("formats in Almaty time with own ru/kk names", () => {
    expect(formatCardDate("2026-12-08T14:00:00Z", "ru")).toBe("8 дек, вт · 19:00");
    expect(formatCardDate("2026-12-08T14:00:00Z", "kk")).toBe("8 жел, сс · 19:00");
    // 20:30 UTC Saturday = 01:30 Sunday in Almaty
    expect(formatCardDate("2026-11-21T20:30:00Z", "ru", "Asia/Almaty")).toBe("22 ноя, вс · 01:30");
  });
});
