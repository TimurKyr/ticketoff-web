import { describe, expect, it } from "vitest";

import type { PlatformSettingsOut } from "@/lib/api/types";

import { draftFrom, invalidFields, parseSetting, settingsPatch } from "./settings";

const current: PlatformSettingsOut = {
  activation_fee_kzt: 5000,
  processing_fee_percent: 3,
  checkout_hold_minutes: 15,
  currency: "KZT",
  read_only: false,
  updated_at: null,
};

describe("settingsPatch", () => {
  it("is empty when nothing changed", () => {
    expect(settingsPatch(current, draftFrom(current))).toEqual({});
  });

  it("sends only the changed fields", () => {
    const draft = { ...draftFrom(current), activation_fee_kzt: "7000" };
    expect(settingsPatch(current, draft)).toEqual({ activation_fee_kzt: 7000 });
  });

  it("treats the same number written differently as unchanged", () => {
    const draft = { ...draftFrom(current), checkout_hold_minutes: " 15 ", processing_fee_percent: "0" };
    expect(settingsPatch(current, draft)).toEqual({ processing_fee_percent: 0 });
  });

  it("leaves invalid values out", () => {
    const draft = { ...draftFrom(current), checkout_hold_minutes: "1441", activation_fee_kzt: "6000" };
    expect(settingsPatch(current, draft)).toEqual({ activation_fee_kzt: 6000 });
  });
});

describe("setting bounds", () => {
  it("match the API", () => {
    expect(parseSetting("activation_fee_kzt", "0")).toBeNull();
    expect(parseSetting("activation_fee_kzt", "10000000")).toBe(10_000_000);
    expect(parseSetting("activation_fee_kzt", "10000001")).toBeNull();
    expect(parseSetting("processing_fee_percent", "0")).toBe(0);
    expect(parseSetting("processing_fee_percent", "101")).toBeNull();
    expect(parseSetting("checkout_hold_minutes", "1440")).toBe(1440);
    expect(parseSetting("checkout_hold_minutes", "2.5")).toBeNull();
    expect(parseSetting("checkout_hold_minutes", "")).toBeNull();
  });

  it("lists invalid fields", () => {
    expect(invalidFields({ ...draftFrom(current), processing_fee_percent: "-1" })).toEqual([
      "processing_fee_percent",
    ]);
  });
});
