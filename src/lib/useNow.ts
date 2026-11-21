import { useEffect, useState } from "react";

import { serverNow } from "@/lib/serverClock";

/**
 * Current server time in ms (see `serverClock`), refreshed every `intervalMs` and when the tab becomes visible again
 * (browsers slow down timers in hidden tabs), so time-based UI such as sales windows
 * updates on its own.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const tick = () => setNow(serverNow());
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return now;
}
