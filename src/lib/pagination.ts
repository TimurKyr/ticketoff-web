/**
 * Page number from the URL (?page=N). Only whole numbers from 1 up are accepted; anything
 * else (?page=1.5, ?page=Infinity, ?page=-2, ?page=abc) means page 1.
 */
export function parsePage(raw: string | null): number {
  if (!raw || !/^[1-9]\d{0,5}$/.test(raw)) return 1;
  return Number(raw);
}

/** Number of pages for `total` items, at least 1. */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
