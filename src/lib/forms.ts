import { useEffect, useState } from "react";

// Largest numbers the forms accept. The API stores them as 32-bit integers, so far larger
// values would fail on the server instead of with a clear message here.
export const MAX_QUANTITY = 1_000_000;
export const MAX_PRICE_KZT = 100_000_000;

/** Whole number from `min` to `max`, typed as digits only (no "1e3", "1.5" or "-1"). */
export function isWholeInRange(raw: string, min: number, max: number): boolean {
  const value = raw.trim();
  if (!/^\d+$/.test(value)) return false;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= min && n <= max;
}

/**
 * Form state for editing server data. When the server data changes (refetch after a save,
 * or someone else's change), fields the user has not touched take the new values; fields
 * the user is editing keep what they typed. So an untouched field never sends an old value
 * back over a newer one.
 */
export function useSyncedValues<T extends object>(server: T) {
  const [values, setValues] = useState<T>(server);
  const [base, setBase] = useState<T>(server);
  const serverKey = JSON.stringify(server);

  useEffect(() => {
    const next = JSON.parse(serverKey) as T;
    setValues((current) => {
      const merged = { ...current };
      for (const key of Object.keys(next) as (keyof T)[]) {
        if (current[key] === base[key]) merged[key] = next[key];
      }
      return merged;
    });
    setBase(next);
    // `base` is read only to tell touched from untouched fields at the moment of the change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  return [values, setValues] as const;
}
