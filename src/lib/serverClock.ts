// The API's clock, as seen from the browser. Hold timers compare against server time, so a
// device clock that runs ahead must not end a hold the server still honours.
//
// The offset comes from the `Date` header of API responses. Cross-origin, the browser only
// exposes it when the API lists it in `Access-Control-Expose-Headers`; until then
// `headers.get("Date")` is null and the offset stays 0 (device clock).

let offsetMs = 0;

/** Record the server time from a response's `Date` header (1 s precision). */
export function noteServerDate(header: string | null): void {
  if (!header) return;
  const serverMs = Date.parse(header);
  if (!Number.isNaN(serverMs)) offsetMs = serverMs - Date.now();
}

/** Current server time in ms (device time when the offset is unknown). */
export function serverNow(): number {
  return Date.now() + offsetMs;
}
