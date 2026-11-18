import type { Language } from "@/lib/i18n";

const LOCALES: Record<Language, string> = { ru: "ru-RU", kk: "kk-KZ" };

/** Whole tenge from the API, e.g. "15 000 ₸". Never computed on the client. */
export function formatKzt(amount: number, lang: Language): string {
  return new Intl.NumberFormat(LOCALES[lang], {
    style: "currency",
    currency: "KZT",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Date and time in the venue's time zone (falls back to the browser's). */
export function formatDateTime(iso: string, lang: Language, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  };
  try {
    return new Intl.DateTimeFormat(LOCALES[lang], { ...options, timeZone }).format(new Date(iso));
  } catch {
    // unknown time zone name
    return new Intl.DateTimeFormat(LOCALES[lang], options).format(new Date(iso));
  }
}

/** Platform default zone (all venues are in Kazakhstan, UTC+5). */
export const DEFAULT_TIME_ZONE = "Asia/Almaty";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar day "YYYY-MM-DD" (rejects "invalid", "2026-02-31"). */
export function isValidDay(day: string): boolean {
  if (!DAY_RE.test(day)) return false;
  const date = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(day);
}

/**
 * Day from <input type="date"> → start/end of that day in `timeZone` (Kazakhstan time by
 * default, not the browser's zone), as UTC ISO. Invalid input → undefined (filter ignored).
 */
export function dayStartIso(day: string, timeZone = DEFAULT_TIME_ZONE): string | undefined {
  return isValidDay(day) ? (localInputToIso(`${day}T00:00`, timeZone) ?? undefined) : undefined;
}

export function dayEndIso(day: string, timeZone = DEFAULT_TIME_ZONE): string | undefined {
  if (!isValidDay(day)) return undefined;
  const start = localInputToIso(`${day}T00:00`, timeZone);
  // Next day's start minus 1 ms (handles 23/25-hour DST days).
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextStart = localInputToIso(`${next.toISOString().slice(0, 10)}T00:00`, timeZone);
  return start && nextStart ? new Date(Date.parse(nextStart) - 1).toISOString() : undefined;
}

// <input type="datetime-local"> has no time zone. Organizers type the venue's local time,
// so convert between that wall-clock value ("2026-11-20T19:00") and a UTC ISO string.

function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** "2026-11-20T19:00" in `timeZone` → "2026-11-20T14:00:00.000Z". Empty → null. */
export function localInputToIso(value: string, timeZone: string): string | null {
  if (!value) return null;
  const [date, time] = value.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes handle a DST change between the guess and the result.
  let utc = wallAsUtc - zoneOffsetMs(wallAsUtc, timeZone);
  utc = wallAsUtc - zoneOffsetMs(utc, timeZone);
  return new Date(utc).toISOString();
}

/** ISO from the API → "2026-11-20T19:00" in `timeZone` for a datetime-local input. */
export function isoToLocalInput(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  const utc = new Date(iso).getTime();
  const wall = new Date(utc + zoneOffsetMs(utc, timeZone));
  return wall.toISOString().slice(0, 16);
}
