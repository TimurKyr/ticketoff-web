import { useEffect } from "react";

const APP = "ticketoff";

/** Sets the tab title to "<title> — ticketoff" while the page is shown. */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} — ${APP}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
