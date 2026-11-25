import type { PlatformSettingsOut, PlatformSettingsUpdate } from "@/lib/api/types";

export const SETTING_FIELDS = ["activation_fee_kzt", "processing_fee_percent", "checkout_hold_minutes"] as const;
export type SettingField = (typeof SETTING_FIELDS)[number];
export type SettingsDraft = Record<SettingField, string>;

/** Bounds as in `PlatformSettingsUpdate` of the API (BE-26). */
export const SETTING_BOUNDS: Record<SettingField, { min: number; max: number }> = {
  activation_fee_kzt: { min: 1, max: 10_000_000 },
  processing_fee_percent: { min: 0, max: 100 },
  checkout_hold_minutes: { min: 1, max: 1440 },
};

export function draftFrom(settings: PlatformSettingsOut): SettingsDraft {
  return {
    activation_fee_kzt: String(settings.activation_fee_kzt),
    processing_fee_percent: String(settings.processing_fee_percent),
    checkout_hold_minutes: String(settings.checkout_hold_minutes),
  };
}

/** Whole number within the API bounds, or null. */
export function parseSetting(field: SettingField, raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  const { min, max } = SETTING_BOUNDS[field];
  return value >= min && value <= max ? value : null;
}

/** Fields whose draft is not a valid value. */
export function invalidFields(draft: SettingsDraft): SettingField[] {
  return SETTING_FIELDS.filter((field) => parseSetting(field, draft[field]) === null);
}

/**
 * PATCH body with only the changed fields (the API changes only what is sent, and an empty
 * body is a 422). Invalid fields are left out: check `invalidFields` first.
 */
export function settingsPatch(current: PlatformSettingsOut, draft: SettingsDraft): PlatformSettingsUpdate {
  const patch: PlatformSettingsUpdate = {};
  for (const field of SETTING_FIELDS) {
    const value = parseSetting(field, draft[field]);
    if (value !== null && value !== current[field]) patch[field] = value;
  }
  return patch;
}
