import { DEFAULT_TIME_ZONE, isoToLocalInput } from "@/lib/format";
import type { Language } from "@/lib/i18n";

// Own month and weekday names: Intl has no reliable "kk" data in every browser
// (Chrome prints "22 M11, Sun"). TODO: replace with formatShortDateTime from lib/format.ts
// once FE-11 lands (same output), then delete this file.
const MONTHS_SHORT: Record<Language, string[]> = {
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  kk: ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"],
};
// Sunday first, as Date.getUTCDay().
const WEEKDAYS: Record<Language, string[]> = {
  ru: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  kk: ["жс", "дс", "сс", "ср", "бс", "жм", "сб"],
};

/** Short date for event cards: "7 дек, пн · 19:00" in the venue's zone. */
export function formatCardDate(iso: string, lang: Language, timeZone = DEFAULT_TIME_ZONE): string {
  let wall: string;
  try {
    wall = isoToLocalInput(iso, timeZone); // "2026-12-07T19:00"
  } catch {
    wall = isoToLocalInput(iso, DEFAULT_TIME_ZONE); // unknown time zone name
  }
  const [date, time] = wall.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${d} ${MONTHS_SHORT[lang][m - 1]}, ${WEEKDAYS[lang][weekday]} · ${time}`;
}
