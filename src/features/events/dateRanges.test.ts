import { describe, expect, it } from "vitest";

import { dayEndIso, dayStartIso } from "@/lib/format";

import { activePreset, presetRange } from "./dateRanges";

// Almaty is UTC+5. 2026-11-22 is a Sunday.
const at = (iso: string) => new Date(iso);

describe("presetRange", () => {
  it("counts today in Almaty, not in UTC", () => {
    // 20:30 UTC on Friday = 01:30 Saturday in Almaty
    expect(presetRange("today", at("2026-11-20T20:30:00Z"))).toEqual({
      from: "2026-11-21",
      to: "2026-11-21",
    });
    expect(presetRange("tomorrow", at("2026-11-20T20:30:00Z"))).toEqual({
      from: "2026-11-22",
      to: "2026-11-22",
    });
  });

  it("weekend on a weekday is the next Saturday and Sunday", () => {
    // Wednesday 2026-11-18, 12:00 Almaty
    expect(presetRange("weekend", at("2026-11-18T07:00:00Z"))).toEqual({
      from: "2026-11-21",
      to: "2026-11-22",
    });
  });

  it("weekend on Saturday starts today", () => {
    expect(presetRange("weekend", at("2026-11-21T07:00:00Z"))).toEqual({
      from: "2026-11-21",
      to: "2026-11-22",
    });
  });

  it("weekend on Sunday is only today", () => {
    expect(presetRange("weekend", at("2026-11-22T07:00:00Z"))).toEqual({
      from: "2026-11-22",
      to: "2026-11-22",
    });
    // 23:30 Sunday in Almaty (18:30 UTC) is still Sunday
    expect(presetRange("weekend", at("2026-11-22T18:30:00Z"))).toEqual({
      from: "2026-11-22",
      to: "2026-11-22",
    });
  });

  it("crosses month and year ends", () => {
    // Thursday 2026-12-31
    expect(presetRange("tomorrow", at("2026-12-31T07:00:00Z"))).toEqual({
      from: "2027-01-01",
      to: "2027-01-01",
    });
    expect(presetRange("weekend", at("2026-12-31T07:00:00Z"))).toEqual({
      from: "2027-01-02",
      to: "2027-01-03",
    });
  });

  it("days map to Almaty midnight in the API query", () => {
    expect(dayStartIso("2026-11-21")).toBe("2026-11-20T19:00:00.000Z");
    expect(dayEndIso("2026-11-22")).toBe("2026-11-22T18:59:59.999Z");
  });
});

describe("activePreset", () => {
  const now = at("2026-11-18T07:00:00Z"); // Wednesday
  it("matches the chip of the range", () => {
    expect(activePreset("2026-11-18", "2026-11-18", now)).toBe("today");
    expect(activePreset("2026-11-19", "2026-11-19", now)).toBe("tomorrow");
    expect(activePreset("2026-11-21", "2026-11-22", now)).toBe("weekend");
  });
  it("is null for a custom range", () => {
    expect(activePreset("2026-11-20", "2026-11-20", now)).toBeNull();
    expect(activePreset("", "", now)).toBeNull();
  });
});
