// Thin fetch wrapper for the ticketoff API.
//
// API response/request shapes come from `schema.d.ts` (generated via
// `npm run gen:api-types` -> openapi-typescript). Do not hand-write
// request/response types here: use the aliases in `./types` instead.

import { clearAuthToken, getAuthToken } from "@/lib/auth/token";
import { noteServerDate } from "@/lib/serverClock";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://api.ticketoff.store"
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  body: unknown;
  /**
   * Seconds from the `Retry-After` header of a 429, or null. Cross-origin the browser shows
   * it only if the API lists it in `Access-Control-Expose-Headers`.
   */
  retryAfter: number | null;

  constructor(status: number, body: unknown, message?: string, retryAfter: number | null = null) {
    super(message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.retryAfter = retryAfter;
  }

  /** `detail` from `{"detail": ...}`: a string, or a list of 422 validation errors. */
  get detail(): unknown {
    if (this.body && typeof this.body === "object" && "detail" in this.body) {
      return (this.body as { detail: unknown }).detail;
    }
    return undefined;
  }

  /** Machine-readable `code` some errors carry next to `detail`, e.g. "EMAIL_NOT_VERIFIED". */
  get code(): string | undefined {
    if (this.body && typeof this.body === "object" && "code" in this.body) {
      const code = (this.body as { code: unknown }).code;
      return typeof code === "string" ? code : undefined;
    }
    return undefined;
  }
}

// Called when an authenticated request gets 401 (expired or revoked token).
// The auth feature registers a handler that logs out and opens /login.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON body. */
  body?: unknown;
  /** Form body, sent as application/x-www-form-urlencoded (e.g. POST /auth/login). */
  form?: Record<string, string>;
  /** multipart/form-data with files (e.g. a support reply). The browser sets the boundary. */
  formData?: FormData;
  /** "blob" for files (e.g. GET /tickets/{id}/pdf); default "json". */
  responseType?: "json" | "blob";
}

async function request<TResponse>(
  path: string,
  { body, form, formData, headers, responseType = "json", ...options }: RequestOptions = {}
): Promise<TResponse> {
  const token = getAuthToken();

  let payload: BodyInit | undefined;
  const contentType: Record<string, string> = {};
  if (formData !== undefined) {
    // No Content-Type here: fetch adds multipart/form-data with the right boundary.
    payload = formData;
  } else if (form !== undefined) {
    payload = new URLSearchParams(form);
    contentType["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    contentType["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(responseType === "json" ? { Accept: "application/json" } : {}),
      ...contentType,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: payload,
  });
  noteServerDate(res.headers.get("Date"));

  if (!res.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await res.json();
    } catch {
      // response had no JSON body
    }
    if (res.status === 401 && token) {
      clearAuthToken();
      onUnauthorized?.();
    }
    const retryAfter = Number.parseInt(res.headers.get("Retry-After") ?? "", 10);
    throw new ApiError(
      res.status,
      errorBody,
      undefined,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null
    );
  }

  if (responseType === "blob") {
    return (await res.blob()) as TResponse;
  }

  if (res.status === 204) {
    return undefined as TResponse;
  }

  return (await res.json()) as TResponse;
}

export const apiClient = {
  get: <TResponse>(path: string, options?: RequestOptions) =>
    request<TResponse>(path, { ...options, method: "GET" }),
  post: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>(path, { ...options, method: "POST", body }),
  /** File download with the same auth and 401 handling, e.g. the ticket PDF. */
  getBlob: (path: string, options?: RequestOptions) =>
    request<Blob>(path, { ...options, method: "GET", responseType: "blob" }),
  /** multipart/form-data: text fields and files in one request. */
  postFormData: <TResponse>(path: string, formData: FormData, options?: RequestOptions) =>
    request<TResponse>(path, { ...options, method: "POST", formData }),
  postForm: <TResponse>(
    path: string,
    form: Record<string, string>,
    options?: RequestOptions
  ) => request<TResponse>(path, { ...options, method: "POST", form }),
  patch: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>(path, { ...options, method: "PATCH", body }),
  put: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>(path, { ...options, method: "PUT", body }),
  delete: <TResponse>(path: string, options?: RequestOptions) =>
    request<TResponse>(path, { ...options, method: "DELETE" }),
};
