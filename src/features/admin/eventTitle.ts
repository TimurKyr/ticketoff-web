/** `event_title` if this API version sends it (BE-37), without depending on the generated types. */
export function eventTitleOf(row: object): string | null {
  const value = (row as { event_title?: unknown }).event_title;
  return typeof value === "string" && value ? value : null;
}
