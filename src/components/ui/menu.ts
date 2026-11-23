// Keyboard rules of a dropdown menu (WAI-ARIA menu button pattern), kept apart from React so
// they can be tested without a DOM. `useMenu` applies them.

export type MenuAction =
  | { type: "focus"; index: number }
  | { type: "close"; returnFocus: boolean }
  | { type: "none" };

/** What a key pressed inside an open menu does; `index` is the focused item (-1: none). */
export function menuKeyAction(key: string, index: number, count: number): MenuAction {
  switch (key) {
    case "Escape":
      return { type: "close", returnFocus: true };
    case "Tab":
      // Tab leaves the menu: close it and let the browser move focus on.
      return { type: "close", returnFocus: false };
    case "ArrowDown":
      return count ? { type: "focus", index: (index + 1 + count) % count } : { type: "none" };
    case "ArrowUp":
      return count ? { type: "focus", index: (index - 1 + count) % count } : { type: "none" };
    case "Home":
      return count ? { type: "focus", index: 0 } : { type: "none" };
    case "End":
      return count ? { type: "focus", index: count - 1 } : { type: "none" };
    default:
      return { type: "none" };
  }
}

/**
 * Keys on the closed menu's button: ArrowDown/Enter/Space open it on the first item,
 * ArrowUp on the last. Null: the key does nothing special (a click still toggles).
 */
export function menuButtonKeyAction(key: string, count: number): number | null {
  if (key === "ArrowDown") return 0;
  if (key === "ArrowUp") return Math.max(count - 1, 0);
  return null;
}
