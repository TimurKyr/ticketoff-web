import type { EventOut } from "@/lib/api/types";

import { CATEGORIES, type Category } from "@/features/events/categories";

// Home rows are built on the client from one GET /events?limit=100 (brief §7a).
export const ROW_SIZE = 8;
export const ROW_MIN = 3; // a row with fewer events is not shown

export type HomeRow =
  | { kind: "upcoming"; events: EventOut[] }
  | { kind: "free"; events: EventOut[] }
  | { kind: "category"; category: Category; events: EventOut[] };

const byStart = (a: EventOut, b: EventOut) => Date.parse(a.start_at) - Date.parse(b.start_at);

export function buildRows(events: EventOut[]): HomeRow[] {
  const sorted = [...events].sort(byStart);
  const rows: HomeRow[] = [{ kind: "upcoming", events: sorted.slice(0, ROW_SIZE) }];

  // price_from 0 = a free type is on sale (null = nothing on sale, not free)
  rows.push({ kind: "free", events: sorted.filter((e) => e.price_from === 0).slice(0, ROW_SIZE) });

  // The two most common named categories ("other" is a catch-all, not a row).
  const groups = new Map<Category, EventOut[]>();
  for (const event of sorted) {
    const key = (event.category ?? "").trim().toLowerCase() as Category;
    if (!CATEGORIES.includes(key) || key === "other") continue;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  [...groups.entries()]
    .filter(([, list]) => list.length >= ROW_MIN)
    .sort(([a, x], [b, y]) => y.length - x.length || CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b))
    .slice(0, 2)
    .forEach(([category, list]) => rows.push({ kind: "category", category, events: list.slice(0, ROW_SIZE) }));

  // "Ближайшие" stays even when short: a city with 1–2 events still shows them.
  return rows.filter((row) =>
    row.kind === "upcoming" ? row.events.length > 0 : row.events.length >= ROW_MIN,
  );
}
