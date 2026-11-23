import type { Language } from "@/lib/i18n";

const NBSP = "\u00a0";

/**
 * Whole tenge from the API → "15 000 ₸" in every language (non-breaking spaces).
 * `_lang` is accepted for call-site symmetry with the date helpers; the format is the same.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatKzt(amount: number, _lang?: Language): string {
  const sign = amount < 0 ? "−" : "";
  const digits = String(Math.round(Math.abs(amount)));
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}₸`;
}

// Own month and weekday names: Intl has no reliable "kk" data in every browser
// (Chrome prints "2026 M12 7"), so dates never depend on it.
const MONTHS: Record<Language, string[]> = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  kk: ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"],
};
const MONTHS_SHORT: Record<Language, string[]> = {
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  kk: ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"],
};
// Sunday first, as Date.getUTCDay().
const WEEKDAYS: Record<Language, string[]> = {
  ru: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  kk: ["жс", "дс", "сс", "ср", "бс", "жм", "сб"],
};

interface WallClock {
  year: number;
  month: number; // 0-11
  day: number;
  weekday: number; // 0 = Sunday
  hh: string;
  mm: string;
  /** "GMT+5", "GMT+5:30", "GMT": the offset of the zone the time was converted to. */
  zone: string;
}

function gmtLabel(offsetMs: number): string {
  const total = Math.round(offsetMs / 60_000);
  if (total === 0) return "GMT";
  const abs = Math.abs(total);
  const minutes = abs % 60;
  return `GMT${total < 0 ? "−" : "+"}${Math.floor(abs / 60)}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
}

/** Wall-clock parts of `iso` in `timeZone` (Kazakhstan time by default). */
function wallClock(iso: string, timeZone: string = DEFAULT_TIME_ZONE): WallClock {
  const utc = new Date(iso).getTime();
  let offset = 0;
  try {
    offset = zoneOffsetMs(utc, timeZone);
  } catch {
    offset = zoneOffsetMs(utc, DEFAULT_TIME_ZONE); // unknown time zone name
  }
  const d = new Date(utc + offset);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hh: String(d.getUTCHours()).padStart(2, "0"),
    mm: String(d.getUTCMinutes()).padStart(2, "0"),
    zone: gmtLabel(offset),
  };
}

/**
 * Date and time in the venue's time zone (Kazakhstan time when none is given), with that
 * zone's offset so a buyer abroad does not read it as local time:
 * "7 декабря 2026, пн · 19:00 GMT+5", "7 желтоқсан 2026, дс · 19:00 GMT+5".
 */
export function formatDateTime(iso: string, lang: Language, timeZone?: string): string {
  const w = wallClock(iso, timeZone);
  return `${w.day} ${MONTHS[lang][w.month]} ${w.year}, ${WEEKDAYS[lang][w.weekday]} · ${w.hh}:${w.mm}${NBSP}${w.zone}`;
}

/**
 * Short form for cards, same zone label: "7 дек, пн · 19:00 GMT+5" (year only if not this one).
 */
export function formatShortDateTime(iso: string, lang: Language, timeZone?: string): string {
  const w = wallClock(iso, timeZone);
  const year = w.year !== wallClock(new Date().toISOString(), timeZone).year ? ` ${w.year}` : "";
  return `${w.day} ${MONTHS_SHORT[lang][w.month]}${year}, ${WEEKDAYS[lang][w.weekday]} · ${w.hh}:${w.mm}${NBSP}${w.zone}`;
}

/**
 * A calendar day from the API ("2026-11-21", already in the venue's zone) → "21 ноя"
 * ("21 қар" in kk), with the year when it is not this year. No time-zone conversion.
 */
export function formatDay(day: string, lang: Language): string {
  const [y, m, d] = day.split("-").map(Number);
  const year = y !== new Date().getFullYear() ? ` ${y}` : "";
  return `${d}${NBSP}${MONTHS_SHORT[lang][m - 1]}${year}`;
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
