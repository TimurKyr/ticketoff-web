import type { MessageKey } from "@/lib/i18n";

// Event category is a free string in the API. The demo seed (BE-24) uses
// these values; anything else is shown as "Другое".
export const CATEGORIES = ["music", "theatre", "education", "sport", "kids", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export function toCategory(value: string | null | undefined): Category {
  const key = (value ?? "").trim().toLowerCase();
  return (CATEGORIES as readonly string[]).includes(key) ? (key as Category) : "other";
}

export function categoryLabelKey(value: string | null | undefined): MessageKey {
  return `category.${toCategory(value)}`;
}
