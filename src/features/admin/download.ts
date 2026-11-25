import { API_BASE_URL, ApiError } from "@/lib/api/client";
import { getAuthToken } from "@/lib/auth/token";

export const REPORT_KINDS = ["payments", "refunds", "orders"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

/**
 * File name from a `Content-Disposition` header: `filename*=UTF-8''…` wins over `filename=`.
 * Path parts are dropped; no usable name → `fallback`.
 */
export function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  let name: string | undefined;
  const star = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(header);
  if (star) {
    try {
      name = decodeURIComponent(star[2].trim().replace(/^"|"$/g, ""));
    } catch {
      name = undefined;
    }
  }
  if (!name) {
    const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/i.exec(header);
    name = plain ? (plain[2] ?? plain[1]).trim() : undefined;
  }
  name = name?.split(/[\\/]/).pop()?.trim();
  return name ? name : fallback;
}

/** Query of a report: both days optional (Asia/Almaty days, inclusive, as the API takes them). */
export function reportPath(kind: ReportKind, fromDate: string, toDate: string): string {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  const query = params.toString();
  return `/admin/reports/${kind}.csv${query ? `?${query}` : ""}`;
}

/**
 * GET /admin/reports/{kind}.csv (R-129) with the token in the header (never in the URL), then
 * save the Blob under the name the server gives.
 */
export async function downloadReport(kind: ReportKind, fromDate: string, toDate: string): Promise<string> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${reportPath(kind, fromDate, toDate)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // no JSON body
    }
    throw new ApiError(res.status, body);
  }
  const fallback = `ticketoff-${kind}-${fromDate || "all"}_${toDate || "all"}.csv`;
  const name = filenameFromDisposition(res.headers.get("Content-Disposition"), fallback);
  const url = URL.createObjectURL(await res.blob());
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Give the browser a moment to start the download before the URL goes away.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return name;
}
