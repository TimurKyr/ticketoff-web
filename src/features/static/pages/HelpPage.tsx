import { Link } from "react-router-dom";

import { useI18n } from "@/lib/i18n";

import { STATIC_TEXTS } from "../content";
import { StaticPage, StaticSection } from "../components/StaticPage";

export function HelpPage() {
  const { lang, t } = useI18n();
  const text = STATIC_TEXTS[lang].help;
  return (
    <StaticPage title={text.title} lead={text.lead}>
      <section aria-labelledby="faq-title">
        <h2 id="faq-title" className="sr-only">
          {t("static.faqTitle")}
        </h2>
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {text.faq.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden focus-visible:outline focus-visible:outline-2">
                {item.q}
                <span aria-hidden className="text-gray-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              {item.a.map((p) => (
                <p key={p} className="mt-2 leading-relaxed text-gray-800">
                  {p}
                </p>
              ))}
            </details>
          ))}
        </div>
      </section>
      <StaticSection section={text.contact} />
      <p className="text-sm">
        <Link to="/refund-policy" className="text-[#2448C9] hover:underline">
          {t("footer.refund")} →
        </Link>
      </p>
    </StaticPage>
  );
}
