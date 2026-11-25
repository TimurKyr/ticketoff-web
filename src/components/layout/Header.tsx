import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Inbox,
  LogOut,
  Menu,
  Search,
  Shield,
  Ticket,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { useMenu } from "@/components/ui/useMenu";
import { useAuth } from "@/features/auth";
import { CitySelect } from "@/features/events";
import { NotificationBell } from "@/features/notifications";
import type { MeOut } from "@/lib/api/types";
import { LANGUAGE_LABELS, LANGUAGES, useI18n, type Language } from "@/lib/i18n";

import { isActivePath, userInitial, userMenuItems, type NavIcon, type NavItem } from "./headerNav";

const ICONS: Record<NavIcon, LucideIcon> = {
  calendar: CalendarDays,
  user: User,
  ticket: Ticket,
  briefcase: Briefcase,
  shield: Shield,
  inbox: Inbox,
  help: CircleHelp,
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A18]";

/** Sections in the header bar itself; the rest are in the user menu. */
function mainLinks(user: MeOut | null): NavItem[] {
  const links: NavItem[] = [{ to: "/events", label: "nav.events", icon: "calendar" }];
  if (user) links.push({ to: "/tickets", label: "nav.tickets", icon: "ticket" });
  return links;
}

function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/** Event search: submits to /events?q=… (the list page reads q). */
function SearchBox({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const inputId = useId();
  const current = pathname === "/events" ? new URLSearchParams(search).get("q") ?? "" : "";
  const [value, setValue] = useState(current);

  // Follow the URL (back button, the list page's own search form).
  useEffect(() => setValue(current), [current]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    navigate(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
    onDone?.();
  }

  return (
    <form role="search" onSubmit={submit} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        {t("nav.search")}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5C5A55]"
      />
      <input
        id={inputId}
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("nav.searchPlaceholder")}
        autoFocus={autoFocus}
        enterKeyHint="search"
        data-testid="header-search"
        className="h-11 w-full rounded-full border border-[#D6D3CC] bg-[#F7F6F3] pl-11 pr-24 text-[15px] text-[#1A1A18] placeholder:text-[#6B6963] focus:border-[#1A1A18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A18]/20"
      />
      <button
        type="submit"
        className={`absolute right-1 top-1 h-9 rounded-full bg-[#1A1A18] px-4 text-sm font-semibold text-white hover:bg-black ${focusRing}`}
      >
        {t("nav.searchSubmit")}
      </button>
    </form>
  );
}

function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className="flex h-9 items-center rounded-full bg-[#F2F1EE] p-0.5 text-sm font-medium"
    >
      {(Object.keys(LANGUAGES) as Language[]).map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`h-8 rounded-full px-3 ${focusRing} ${
            lang === code ? "bg-white text-[#1A1A18] shadow-sm" : "text-[#5C5A55] hover:text-[#1A1A18]"
          }`}
        >
          {LANGUAGE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}

function UserMenu({ user, onLogout }: { user: MeOut; onLogout: () => void }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const menu = useMenu();
  const items = userMenuItems(user);
  const inSection = items.some((item) => isActivePath(pathname, item.to, item.end));

  const itemClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#1A1A18] hover:bg-[#F2F1EE] focus:bg-[#F2F1EE] focus:outline-none";

  return (
    <div className="relative">
      <button
        {...menu.buttonProps}
        aria-label={`${t("nav.userMenu")}: ${user.email}`}
        data-testid="user-menu-button"
        className={`flex h-10 items-center gap-1 rounded-full pl-1 pr-2 hover:bg-[#F2F1EE] ${focusRing}`}
      >
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A18] text-sm font-semibold text-white ${
            inSection ? "ring-2 ring-[#1A1A18] ring-offset-2" : ""
          }`}
        >
          {userInitial(user.email)}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-[#5C5A55]" />
      </button>
      {menu.open && (
        <div
          {...menu.menuProps}
          aria-label={t("nav.userMenu")}
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[#E4E1DA] bg-white p-1 shadow-lg"
        >
          <p role="none" className="truncate px-3 pb-2 pt-2 text-xs text-[#5C5A55]" data-testid="current-user">
            {user.email}
          </p>
          <div role="separator" className="my-1 border-t border-[#E4E1DA]" />
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActivePath(pathname, item.to, item.end);
            return (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                tabIndex={-1}
                aria-current={active ? "page" : undefined}
                onClick={() => menu.close(false)}
                className={`${itemClass} ${active ? "font-semibold" : ""}`}
              >
                <Icon aria-hidden="true" className="h-4 w-4 text-[#5C5A55]" />
                {t(item.label)}
              </Link>
            );
          })}
          <div role="separator" className="my-1 border-t border-[#E4E1DA]" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              menu.close(false);
              onLogout();
            }}
            className={itemClass}
          >
            <LogOut aria-hidden="true" className="h-4 w-4 text-[#5C5A55]" />
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

function SectionLink({ item }: { item: NavItem }) {
  const { t } = useI18n();
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `relative flex h-16 items-center px-1 text-sm font-medium after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full ${focusRing} ${
          isActive ? "text-[#1A1A18] after:bg-[#1A1A18]" : "text-[#5C5A55] hover:text-[#1A1A18]"
        }`
      }
    >
      {t(item.label)}
    </NavLink>
  );
}

function GuestLinks({ stacked = false }: { stacked?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={stacked ? "grid grid-cols-2 gap-2" : "flex items-center gap-2"}>
      <Link
        to="/login"
        className={`flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-[#1A1A18] hover:bg-[#F2F1EE] ${
          stacked ? "border border-[#D6D3CC]" : ""
        } ${focusRing}`}
      >
        {t("nav.login")}
      </Link>
      <Link
        to="/register"
        className={`flex h-10 items-center justify-center rounded-full bg-[#1A1A18] px-4 text-sm font-semibold text-white hover:bg-black ${focusRing}`}
      >
        {t("nav.register")}
      </Link>
    </div>
  );
}

/** The phone menu: the same sections, city, language and account links as the bar. */
function MobilePanel({
  id,
  user,
  onClose,
  onLogout,
}: {
  id: string;
  user: MeOut | null;
  onClose: (returnFocus: boolean) => void;
  onLogout: () => void;
}) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const items = [...mainLinks(user), ...(user ? userMenuItems(user).filter((i) => i.to !== "/tickets") : [])];

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose(true);
    }
  }

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-3 text-base ${focusRing} ${
      active ? "bg-[#F2F1EE] font-semibold text-[#1A1A18]" : "text-[#1A1A18] hover:bg-[#F2F1EE]"
    }`;

  return (
    <div
      id={id}
      ref={panelRef}
      onKeyDown={onKeyDown}
      data-testid="mobile-menu"
      className="absolute inset-x-0 top-full max-h-[calc(100vh-4rem)] overflow-auto border-b border-[#E4E1DA] bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden"
    >
      <nav aria-label={t("nav.main")}>
        <ul className="flex flex-col">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActivePath(pathname, item.to, item.end);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onClose(false)}
                  className={linkClass(active)}
                >
                  <Icon aria-hidden="true" className="h-5 w-5 text-[#5C5A55]" />
                  {t(item.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-3 flex items-start justify-between gap-3 border-t border-[#E4E1DA] pt-3">
        <CitySelect inline />
        <LanguageToggle />
      </div>
      <div className="mt-3 border-t border-[#E4E1DA] pt-3">
        {user ? (
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm text-[#5C5A55]">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A1A18] text-sm font-semibold text-white"
              >
                {userInitial(user.email)}
              </span>
              <span className="truncate">{user.email}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onClose(false);
                onLogout();
              }}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#D6D3CC] px-4 text-sm font-semibold text-[#1A1A18] hover:bg-[#F2F1EE] ${focusRing}`}
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              {t("nav.logout")}
            </button>
          </div>
        ) : (
          <GuestLinks stacked />
        )}
      </div>
    </div>
  );
}

export function Header() {
  const { t } = useI18n();
  const { user, isLoading, logout } = useAuth();
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // A new page closes the phone menus.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  function closeMenu(returnFocus: boolean) {
    setMenuOpen(false);
    if (returnFocus) burgerRef.current?.focus();
  }

  const iconButton = `flex h-10 w-10 items-center justify-center rounded-full text-[#1A1A18] hover:bg-[#F2F1EE] ${focusRing}`;

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white transition-shadow ${
        scrolled ? "border-transparent shadow-md" : "border-[#E4E1DA]"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 lg:h-[71px] lg:gap-4">
        <button
          ref={burgerRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? panelId : undefined}
          aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
          onClick={() => setMenuOpen((open) => !open)}
          data-testid="burger-button"
          className={`${iconButton} -ml-2 lg:hidden`}
        >
          {menuOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
        </button>

        <Link to="/" className={`shrink-0 rounded text-xl font-extrabold tracking-tight text-[#1A1A18] ${focusRing}`}>
          {t("app.name")}
        </Link>

        <nav aria-label={t("nav.main")} className="hidden lg:block">
          <ul className="flex items-center gap-4">
            {mainLinks(user).map((item) => (
              <li key={item.to}>
                <SectionLink item={item} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto hidden min-w-0 max-w-xl flex-1 sm:block">
          <SearchBox />
        </div>
        <div className="flex-1 sm:hidden" />

        <button
          type="button"
          aria-expanded={searchOpen}
          aria-label={t("nav.openSearch")}
          onClick={() => setSearchOpen((open) => !open)}
          className={`${iconButton} sm:hidden`}
        >
          <Search aria-hidden="true" className="h-5 w-5" />
        </button>

        <CitySelect className="hidden lg:block" />
        <div className="hidden lg:block">
          <LanguageToggle />
        </div>

        {!isLoading && user && <NotificationBell />}
        <div className="hidden lg:block">
          {isLoading ? (
            <div className="h-10 w-10" />
          ) : user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <GuestLinks />
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[#E4E1DA] bg-white px-4 py-3 sm:hidden">
          <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      {menuOpen && <MobilePanel id={panelId} user={user} onClose={closeMenu} onLogout={logout} />}
    </header>
  );
}
