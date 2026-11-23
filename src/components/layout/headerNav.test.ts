import { describe, expect, it } from "vitest";

import { menuButtonKeyAction, menuKeyAction } from "@/components/ui/menu";

import { isActivePath, pageFrame, userInitial, userMenuItems } from "./headerNav";

const paths = (items: { to: string }[]) => items.map((item) => item.to);

describe("userMenuItems", () => {
  it("buyer: tickets, profile, support", () => {
    expect(paths(userMenuItems({ is_organizer: false, system_role: "attendee" }))).toEqual([
      "/tickets",
      "/account",
      "/support",
    ]);
  });

  it("organizer: adds the cabinet and the inbox, no admin", () => {
    const items = paths(userMenuItems({ is_organizer: true, system_role: "attendee" }));
    expect(items).toContain("/organizer");
    expect(items).toContain("/support/inbox");
    expect(items).not.toContain("/admin");
  });

  it("admin: adds the admin panel and the inbox, no organizer cabinet", () => {
    const items = paths(userMenuItems({ is_organizer: false, system_role: "platform_admin" }));
    expect(items).toContain("/admin");
    expect(items).toContain("/support/inbox");
    expect(items).not.toContain("/organizer");
  });

  it("support is last and matches only its own path", () => {
    const items = userMenuItems({ is_organizer: true, system_role: "platform_admin" });
    expect(items.at(-1)).toMatchObject({ to: "/support", end: true });
  });
});

describe("menu keys", () => {
  it("opens on the first item with ArrowDown and on the last with ArrowUp", () => {
    expect(menuButtonKeyAction("ArrowDown", 4)).toBe(0);
    expect(menuButtonKeyAction("ArrowUp", 4)).toBe(3);
    expect(menuButtonKeyAction("a", 4)).toBeNull();
  });

  it("Esc closes and returns focus to the button", () => {
    expect(menuKeyAction("Escape", 1, 4)).toEqual({ type: "close", returnFocus: true });
  });

  it("Tab closes without taking focus back", () => {
    expect(menuKeyAction("Tab", 1, 4)).toEqual({ type: "close", returnFocus: false });
  });

  it("arrows wrap around, Home/End jump to the ends", () => {
    expect(menuKeyAction("ArrowDown", 3, 4)).toEqual({ type: "focus", index: 0 });
    expect(menuKeyAction("ArrowUp", 0, 4)).toEqual({ type: "focus", index: 3 });
    expect(menuKeyAction("ArrowDown", -1, 4)).toEqual({ type: "focus", index: 0 });
    expect(menuKeyAction("Home", 2, 4)).toEqual({ type: "focus", index: 0 });
    expect(menuKeyAction("End", 0, 4)).toEqual({ type: "focus", index: 3 });
    expect(menuKeyAction("ArrowDown", -1, 0)).toEqual({ type: "none" });
  });
});

describe("helpers", () => {
  it("initial is the first letter of the email, upper case", () => {
    expect(userInitial("demo.buyer@ticketoff.store")).toBe("D");
    expect(userInitial("әлия@mail.kz")).toBe("Ә");
  });

  it("active section: the path and its children, `end` only the path", () => {
    expect(isActivePath("/events", "/events")).toBe(true);
    expect(isActivePath("/events/abc", "/events")).toBe(true);
    expect(isActivePath("/eventsx", "/events")).toBe(false);
    expect(isActivePath("/support/inbox", "/support", true)).toBe(false);
    expect(isActivePath("/", "/events")).toBe(false);
  });

  it("page frames", () => {
    expect(pageFrame("/")).toBe("bare");
    expect(pageFrame("/events")).toBe("bare");
    expect(pageFrame("/events/some-slug")).toBe("bare");
    expect(pageFrame("/organizer/events/1/preview")).toBe("bare");
    expect(pageFrame("/login")).toBe("auth");
    expect(pageFrame("/register/")).toBe("auth");
    expect(pageFrame("/organizer")).toBe("panel");
    expect(pageFrame("/orders/1")).toBe("panel");
  });
});
