import { describe, expect, it } from "vitest";

import { timeLeft } from "./order";

describe("timeLeft", () => {
  const expires = "2026-11-24T12:15:00Z";
  it("counts down in mm:ss", () => {
    expect(timeLeft(expires, Date.parse("2026-11-24T12:10:30Z"))).toBe("4:30");
    expect(timeLeft(expires, Date.parse("2026-11-24T12:16:00Z"))).toBe("0:00");
  });

  it("never starts above 15:00 (FE-22 #20)", () => {
    expect(timeLeft(expires, Date.parse("2026-11-24T11:59:59.400Z"))).toBe("15:00");
  });
});
