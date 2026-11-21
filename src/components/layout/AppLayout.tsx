import { NavLink, Outlet, Link, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "@/features/auth";
import { CitySelect } from "@/features/events";
import { LANGUAGE_LABELS, LANGUAGES, useI18n, type Language } from "@/lib/i18n";

import { Footer } from "./Footer";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-1 py-0.5 hover:underline focus-visible:outline focus-visible:outline-2 ${
    isActive ? "font-semibold text-black" : "text-gray-700"
  }`;

function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="flex items-center gap-1 text-sm text-gray-700">
      <span className="sr-only">{t("nav.language")}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
        className="rounded border border-gray-400 bg-white px-1 py-0.5"
      >
        {(Object.keys(LANGUAGES) as Language[]).map((code) => (
          <option key={code} value={code}>
            {LANGUAGE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}

function Header() {
  const { t } = useI18n();
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link to="/" className="text-lg font-bold">
          {t("app.name")}
        </Link>
        <CitySelect />
        <nav aria-label="main" className="flex flex-wrap gap-3 text-sm">
          <NavLink to="/events" className={navClass}>
            {t("nav.events")}
          </NavLink>
          {user && (
            <NavLink to="/tickets" className={navClass}>
              {t("nav.tickets")}
            </NavLink>
          )}
          {user && (
            <NavLink to="/support" end className={navClass}>
              {t("nav.support")}
            </NavLink>
          )}
          {(user?.is_organizer || user?.system_role === "platform_admin") && (
            <NavLink to="/support/inbox" className={navClass}>
              {t("nav.inbox")}
            </NavLink>
          )}
          {user?.is_organizer && (
            <NavLink to="/organizer" className={navClass}>
              {t("nav.organizer")}
            </NavLink>
          )}
          {user?.system_role === "platform_admin" && (
            <NavLink to="/admin" className={navClass}>
              {t("nav.admin")}
            </NavLink>
          )}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm">
          <LanguageSwitch />
          {isLoading ? null : user ? (
            <>
              <NavLink
                to="/account"
                className={navClass}
                title={t("nav.account")}
                data-testid="current-user"
              >
                {user.email}
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="rounded border border-gray-400 px-2 py-1 hover:bg-gray-100"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                {t("nav.login")}
              </NavLink>
              <Link
                to="/register"
                className="rounded bg-black px-2 py-1 text-white hover:bg-gray-800"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Pages already in the new style (design brief §1a): white cards on a light grey page.
const TINTED = new Set(["/", "/events"]);

export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <AuthProvider>
      <div className={`flex min-h-screen flex-col ${TINTED.has(pathname) ? "bg-[#F2F1EE]" : ""}`}>
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
