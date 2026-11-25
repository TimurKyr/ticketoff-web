import { useEffect, useState } from "react";

import { API_BASE_URL } from "@/lib/api/client";
import { getAuthToken } from "@/lib/auth/token";

function apiOrigin(): string {
  return new URL(API_BASE_URL, window.location.href).origin;
}

/**
 * The cover of the organizer's own event as an object URL (R-12). A draft / private /
 * cancelled event's image is only served with the Bearer token, which `<img src>` can't send.
 * The token goes only to the API's own origin; elsewhere (or if the fetch fails) the caller
 * falls back to the plain URL.
 */
export function useAuthedImage(url: string | null | undefined): { src: string | null; failed: boolean } {
  const [state, setState] = useState<{ src: string | null; failed: boolean }>({ src: null, failed: false });

  useEffect(() => {
    setState({ src: null, failed: false });
    if (!url) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    const token = getAuthToken();
    let sameOrigin = false;
    try {
      sameOrigin = new URL(url).origin === apiOrigin();
    } catch {
      sameOrigin = false;
    }
    if (!token || !sameOrigin) {
      setState({ src: null, failed: true });
      return;
    }
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ src: objectUrl, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ src: null, failed: true });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return state;
}
