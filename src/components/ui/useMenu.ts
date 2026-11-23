import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { menuButtonKeyAction, menuKeyAction } from "./menu";

/**
 * A dropdown menu: a button with aria-haspopup/aria-expanded and a role="menu" list.
 * Opening focuses an item, arrows/Home/End move focus, Esc closes and returns focus to the
 * button, Tab and a click outside close it.
 */
export function useMenu() {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? []);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const list = items();
    list[Math.min(startIndex, list.length - 1)]?.focus();
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, startIndex]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
    const list = items();
    const action = menuKeyAction(event.key, list.indexOf(document.activeElement as HTMLElement), list.length);
    if (action.type === "none") return;
    if (event.key !== "Tab") event.preventDefault();
    if (action.type === "focus") list[action.index]?.focus();
    else close(action.returnFocus);
  }

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = menuButtonKeyAction(event.key, items().length || 99);
    if (index === null) return;
    event.preventDefault();
    setStartIndex(index);
    setOpen(true);
  }

  return {
    open,
    close,
    buttonProps: {
      ref: buttonRef,
      type: "button" as const,
      "aria-haspopup": "menu" as const,
      "aria-expanded": open,
      "aria-controls": open ? menuId : undefined,
      onClick: () => {
        setStartIndex(0);
        setOpen((value) => !value);
      },
      onKeyDown: onButtonKeyDown,
    },
    menuProps: {
      ref: menuRef,
      id: menuId,
      role: "menu" as const,
      onKeyDown: onMenuKeyDown,
    },
  };
}
