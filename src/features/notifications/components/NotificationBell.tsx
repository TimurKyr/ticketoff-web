import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { formatDateTime } from "@/lib/format";
import type { NotificationOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { useBellNotifications, useMarkRead } from "../api";
import { badgeText, NOTIFICATION_LABELS, notificationLink } from "../links";

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/**
 * The header bell for a logged-in user: the unread count (polled every minute) and a menu
 * of the latest notifications. A click marks it read and opens what it is about.
 */
export function NotificationBell() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const query = useBellNotifications(true);
  const markRead = useMarkRead();
  const [open, setOpen] = useState(false);
  // On a phone the menu is fixed to the screen width, just below the bell (the header wraps).
  const [menuTop, setMenuTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const items = query.data?.items ?? [];
  const unread = query.data?.unread_count ?? 0;
  itemRefs.current.length = items.length; // no stale refs when the list gets shorter

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  // A click outside closes the menu (focus stays where the user clicked).
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Opening moves focus to the first item, as a menu does, and places the phone menu.
  useEffect(() => {
    if (!open) return;
    setMenuTop((buttonRef.current?.getBoundingClientRect().bottom ?? 0) + 8);
    itemRefs.current[0]?.focus();
  }, [open]);

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const focusable = itemRefs.current.filter((el): el is HTMLButtonElement => el !== null);
    const index = focusable.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (focusable.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      focusable[(index + step + focusable.length) % focusable.length].focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusable[event.key === "Home" ? 0 : focusable.length - 1]?.focus();
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  function choose(item: NotificationOut) {
    if (item.read_at === null) markRead.mutate(item.id);
    close(false);
    const to = notificationLink(item);
    if (to) navigate(to);
  }

  const label = unread > 0 ? t("notif.bellUnread").replace("{count}", String(unread)) : t("notif.bell");

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        title={label}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="relative rounded p-1 text-gray-800 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2"
        data-testid="notification-bell"
      >
        <BellIcon />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-red-700 px-1 text-center text-xs font-semibold leading-5 text-white"
          >
            {badgeText(unread)}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t("notif.title")}
          onKeyDown={onMenuKey}
          // Phone: fixed full width just below the bell; from sm: under the bell, 20rem wide.
          style={{ top: menuTop }}
          className="fixed inset-x-2 z-30 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:!top-full sm:mt-2 sm:w-80"
        >
          <p className="border-b border-gray-200 px-3 py-2 text-sm font-semibold">{t("notif.title")}</p>
          {query.isError ? (
            <p className="px-3 py-3 text-sm text-red-800">{t("notif.loadError")}</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-700">{t("notif.empty")}</p>
          ) : (
            <ul>
              {items.map((item, index) => {
                const isUnread = item.read_at === null;
                return (
                  <li key={item.id} role="none">
                    <button
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      type="button"
                      role="menuitem"
                      onClick={() => choose(item)}
                      className={`flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-gray-50 focus-visible:bg-gray-100 focus-visible:outline-none ${
                        isUnread ? "font-semibold text-black" : "text-gray-700"
                      }`}
                    >
                      <span>
                        {isUnread && <span className="sr-only">{t("notif.unread")} </span>}
                        {t(NOTIFICATION_LABELS[item.type])}
                      </span>
                      <time dateTime={item.created_at} className="text-xs font-normal text-gray-600">
                        {formatDateTime(item.created_at, lang)}
                      </time>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
