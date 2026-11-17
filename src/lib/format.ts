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

/** "2026-11-20" from <input type="date"> → start/end of that day in the browser's zone, ISO. */
export function dayStartIso(day: string): string {
  return new Date(`${day}T00:00:00`).toISOString();
}

export function dayEndIso(day: string): string {
  return new Date(`${day}T23:59:59.999`).toISOString();
}
