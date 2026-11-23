import type { DailySalesOut } from "@/lib/api/types";

/** One row per calendar day from the first to the last given day; days without sales are 0. */
export function fillDays(days: DailySalesOut[]): DailySalesOut[] {
  if (days.length === 0) return [];
  const byDay = new Map(days.map((d) => [d.day, d]));
  const out: DailySalesOut[] = [];
  // "YYYY-MM-DD" at UTC midnight: plain calendar arithmetic, no time zone involved (the API
  // already gives the days in the venue's zone).
  const cursor = new Date(`${days[0].day}T00:00:00Z`);
  const last = new Date(`${days[days.length - 1].day}T00:00:00Z`);
  while (cursor <= last) {
    const day = cursor.toISOString().slice(0, 10);
    out.push(byDay.get(day) ?? { day, orders: 0, tickets_sold: 0, sales_kzt: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
