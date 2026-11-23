import { useEffect, useId, useRef, useState } from "react";

import type { EventOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

type CalendarLinks = EventOut["calendar_links"];

/**
 * "Добавить в календарь": Google / Outlook / the .ics file (BE-31 calendar_links).
 * Nothing is written to the user's calendar by us: the links open their own calendar app,
 * and the .ics is a download (the API sends it as an attachment, in the venue's time zone).
 */
export function AddToCalendar({ links, className = "" }: { links: CalendarLinks; className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none";
  return (
    <div
      ref={root}
      className={`relative self-start ${className}`}
      // Tab past the last item (or anywhere outside) closes the menu, like a click outside.
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-200"
      >
        {t("calendar.add")} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul
          id={menuId}
          className="absolute left-0 z-20 mt-1 min-w-full whitespace-nowrap rounded-md border border-gray-300 bg-white py-1 shadow-md"
        >
          <li>
            <a href={links.google} target="_blank" rel="noopener noreferrer" className={item} onClick={() => setOpen(false)}>
              {t("calendar.google")}
            </a>
          </li>
          <li>
            <a href={links.outlook} target="_blank" rel="noopener noreferrer" className={item} onClick={() => setOpen(false)}>
              {t("calendar.outlook")}
            </a>
          </li>
          <li>
            <a href={links.ics} download className={item} onClick={() => setOpen(false)}>
              {t("calendar.ics")}
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}
