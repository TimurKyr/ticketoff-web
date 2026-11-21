import { useMemo, useSyncExternalStore } from "react";

import { useI18n } from "@/lib/i18n";

import { useVenues } from "./api";

// The city chosen in the header ("" = all cities). Kept in localStorage so it survives a
// reload; storage may be blocked (private mode), then the choice lives until the tab closes.
const KEY = "ticketoff.city";
const listeners = new Set<() => void>();

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return memory;
  }
}

let memory = "";
let current = read();

export function setCity(city: string): void {
  current = city;
  memory = city;
  try {
    if (city) localStorage.setItem(KEY, city);
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked: keep the in-memory value
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCity(): string {
  return useSyncExternalStore(subscribe, () => current);
}

/** Unique venue cities, sorted for the current language. */
export function useCities(): string[] {
  const { data } = useVenues();
  const { lang } = useI18n();
  return useMemo(() => {
    const cities = new Set((data ?? []).map((venue) => venue.city?.trim()).filter(Boolean) as string[]);
    return [...cities].sort((a, b) => a.localeCompare(b, lang));
  }, [data, lang]);
}
