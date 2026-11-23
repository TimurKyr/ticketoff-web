import { Link } from "react-router-dom";

import { analytics } from "@/lib/analytics";
import { LANGUAGE_LABELS, LANGUAGES, useI18n, type Language, type MessageKey } from "@/lib/i18n";

interface Column {
  title: MessageKey;
  links: { to: string; label: MessageKey; external?: boolean }[];
  note?: MessageKey;
}

const REPO_URL = "https://github.com/TimurKyr/ticketoff-web";

const COLUMNS: Column[] = [
  {
    title: "footer.about",
    links: [
      { to: "/about", label: "footer.aboutService" },
      { to: "/events", label: "footer.allEvents" },
      { to: REPO_URL, label: "footer.github", external: true },
    ],
  },
  {
    title: "footer.organizers",
    links: [
      { to: "/organizers", label: "footer.howToStart" },
      { to: "/organizer", label: "nav.organizer" },
    ],
  },
  {
    title: "footer.help",
    links: [
      { to: "/help", label: "footer.faq" },
      { to: "/tickets", label: "nav.tickets" },
      // Login-guarded: a guest goes to /login and comes back here after it.
      { to: "/support", label: "footer.writeSupport" },
    ],
  },
  {
    title: "footer.refund",
    links: [{ to: "/refund-policy", label: "footer.refundRules" }],
    note: "footer.refundNote",
  },
];

const linkClass = "text-gray-700 hover:text-[#2448C9] hover:underline";

/** Language as two buttons ("Қаз · Рус"); the header keeps its own select. */
function FooterLanguages() {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t("nav.language")} className="flex gap-1">
      {(Object.keys(LANGUAGES) as Language[]).map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`rounded px-2 py-1 text-sm focus-visible:outline focus-visible:outline-2 ${
            lang === code ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-200"
          }`}
        >
          {LANGUAGE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}

/**
 * Site footer: 4 columns on desktop, one column on phones. It is in the normal flow (never
 * fixed); a page with a bar pinned to the bottom sets --bottom-bar-h so the last line stays
 * visible above it.
 */
export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-12 border-t border-[#E4E1DA] bg-white pb-[calc(env(safe-area-inset-bottom)+var(--bottom-bar-h,0px))] text-sm">
      <nav aria-label={t("footer.title")} className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-2 font-semibold text-gray-900">{t(col.title)}</h2>
            <ul className="space-y-1.5">
              {col.links.map((link) => (
                <li key={link.to}>
                  {link.external ? (
                    <a href={link.to} target="_blank" rel="noreferrer" className={linkClass}>
                      {t(link.label)} ↗
                    </a>
                  ) : (
                    <Link to={link.to} className={linkClass}>
                      {t(link.label)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {col.note && <p className="mt-2 text-xs leading-relaxed text-gray-600">{t(col.note)}</p>}
          </div>
        ))}
      </nav>
      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-relaxed text-gray-600">
            <p>© 2026 ticketoff. {t("footer.disclaimer")}</p>
            {analytics.enabled && <p>{t("footer.analytics")}</p>}
          </div>
          <FooterLanguages />
        </div>
      </div>
    </footer>
  );
}
