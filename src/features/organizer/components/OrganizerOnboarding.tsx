import { CalendarPlus, Rocket, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n, type MessageKey } from "@/lib/i18n";

const STEPS: { icon: typeof Ticket; title: MessageKey; text: MessageKey }[] = [
  { icon: CalendarPlus, title: "org.onboarding.step1", text: "org.onboarding.step1Text" },
  { icon: Ticket, title: "org.onboarding.step2", text: "org.onboarding.step2Text" },
  { icon: Rocket, title: "org.onboarding.step3", text: "org.onboarding.step3Text" },
];

/** First visit to an empty dashboard (FE-22 #12): three steps instead of a page of zeros. */
export function OrganizerOnboarding() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="onboarding-title" className="card flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="onboarding-title" className="text-xl font-semibold">
          {t("org.onboarding.title")}
        </h2>
        <p className="text-sm text-gray-700">{t("org.onboarding.lead")}</p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex flex-col gap-2 rounded-2xl bg-[#F5F4F1] p-4">
            <span className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1A18] text-sm text-white">
                {i + 1}
              </span>
              <Icon aria-hidden className="h-4 w-4" />
              {t(title)}
            </span>
            <span className="text-sm text-gray-700">{t(text)}</span>
          </li>
        ))}
      </ol>
      <Link
        to="/organizer/events/new"
        className="self-start rounded-md bg-[#1A1A18] px-4 py-2 text-sm font-medium text-white hover:bg-black"
      >
        {t("org.onboarding.cta")}
      </Link>
    </section>
  );
}
