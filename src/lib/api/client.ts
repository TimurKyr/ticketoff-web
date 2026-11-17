// Thin fetch wrapper for the ticketoff API.
//
// API response/request shapes come from `schema.d.ts` (generated via
// `npm run gen:api-types` -> openapi-typescript). Do not hand-write
// request/response types here: use the aliases in `./types` instead.

import { clearAuthToken, getAuthToken } from "@/lib/auth/token";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://api.ticketoff.store"
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** `detail` from `{"detail": ...}`: a string, or a list of 422 validation errors. */
  get detail(): unknown {
    if (this.body && typeof this.body === "object" && "detail" in this.body) {
      return (this.body as { detail: unknown }).detail;
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
  /** "blob" for files (e.g. GET /tickets/{id}/pdf); default "json". */
  responseType?: "json" | "blob";
}

async function request<TResponse>(
  path: string,
  { body, form, headers, responseType = "json", ...options }: RequestOptions = {}
): Promise<TResponse> {
  const token = getAuthToken();

  let payload: BodyInit | undefined;
  const contentType: Record<string, string> = {};
  if (form !== undefined) {
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
    throw new ApiError(res.status, errorBody);
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
