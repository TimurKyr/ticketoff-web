import type { MeOut } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n";

export type NavIcon = "calendar" | "user" | "ticket" | "briefcase" | "shield" | "inbox" | "help";

export interface NavItem {
  to: string;
  label: MessageKey;
  icon: NavIcon;
  /** Active only on this exact path (/support, not /support/inbox). */
  end?: boolean;
}

type Who = Pick<MeOut, "is_organizer" | "system_role">;

/** The user menu (and the burger menu) items, by role. Logout is added by the menu itself. */
export function userMenuItems(user: Who): NavItem[] {
  const admin = user.system_role === "platform_admin";
  const items: NavItem[] = [
    { to: "/tickets", label: "nav.tickets", icon: "ticket" },
    { to: "/account", label: "nav.account", icon: "user" },
  ];
  if (user.is_organizer) items.push({ to: "/organizer", label: "nav.organizer", icon: "briefcase" });
  if (admin) items.push({ to: "/admin", label: "nav.admin", icon: "shield" });
  if (user.is_organizer || admin) items.push({ to: "/support/inbox", label: "nav.inbox", icon: "inbox" });
  items.push({ to: "/support", label: "nav.support", icon: "help", end: true });
  return items;
}

/** The letter in the avatar circle: the first letter of the email. */
export function userInitial(email: string): string {
  return (email.trim()[0] ?? "?").toUpperCase();
}

/** Same rule as NavLink: the path itself or anything under it (`end`: only the path). */
export function isActivePath(pathname: string, to: string, end = false): boolean {
  if (pathname === to) return true;
  return !end && to !== "/" && pathname.startsWith(`${to}/`);
}

/**
 * How the layout frames a page on the beige background:
 * - bare: the page lays out its own white cards (home, events, event page, preview);
 * - auth: one narrow white card in the middle (login, register, email confirmation);
 * - panel: one white panel for the whole page (cabinets, tickets, support, static pages).
 */
export type PageFrame = "bare" | "auth" | "panel";

export function pageFrame(pathname: string): PageFrame {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/events" || path.startsWith("/events/")) return "bare";
  if (/^\/organizer\/events\/[^/]+\/preview$/.test(path)) return "bare";
  if (["/login", "/register", "/verify-email", "/reset-password", "/forgot-password"].includes(path)) {
    return "auth";
  }
  return "panel";
}
