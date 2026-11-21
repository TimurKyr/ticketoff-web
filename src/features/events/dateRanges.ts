import { DEFAULT_TIME_ZONE } from "@/lib/format";

// Date chips "Сегодня / Завтра / Выходные". Days are counted in Kazakhstan time (all
// venues are in Asia/Almaty), not in the browser's zone. The result is a pair of days
// "YYYY-MM-DD" for /events?from=&to=; the list page turns them into from_date/to_date.

export type DatePreset = "today" | "tomorrow" | "weekend";
export const DATE_PRESETS: DatePreset[] = ["today", "tomorrow", "weekend"];

export interface DayRange {
  from: string;
  to: string;
}

/** Calendar day "YYYY-MM-DD" of `now` in `timeZone`. */
export function dayInZone(now: Date, timeZone = DEFAULT_TIME_ZONE): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday. */
function weekday(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

export function presetRange(preset: DatePreset, now: Date, timeZone = DEFAULT_TIME_ZONE): DayRange {
  const today = dayInZone(now, timeZone);
  if (preset === "today") return { from: today, to: today };
  if (preset === "tomorrow") {
    const tomorrow = addDays(today, 1);
    return { from: tomorrow, to: tomorrow };
  }
  // Weekend: the nearest Saturday and Sunday; on Saturday from today, on Sunday only today.
  const dow = weekday(today);
  if (dow === 0) return { from: today, to: today };
  const saturday = addDays(today, 6 - dow);
  return { from: saturday, to: addDays(saturday, 1) };
}

/** Which chip a ?from=&to= pair matches, if any. */
export function activePreset(
  from: string,
  to: string,
  now: Date,
  timeZone = DEFAULT_TIME_ZONE,
): DatePreset | null {
  if (!from || !to) return null;
  return (
    DATE_PRESETS.find((preset) => {
      const range = presetRange(preset, now, timeZone);
      return range.from === from && range.to === to;
    }) ?? null
  );
}
