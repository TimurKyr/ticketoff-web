import { Link } from "react-router-dom";

import { useEvents } from "@/features/events/api";
import { useI18n } from "@/lib/i18n";

import { HOME_PROMO } from "../promo";

const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Static, no carousel. Hidden when the promo event is not published (other database). */
export function PromoBanner() {
  const { t } = useI18n();
  const search = useEvents({ q: HOME_PROMO.eventTitle });
  const event = search.data?.items.find((item) => item.title.includes(HOME_PROMO.eventTitle));

  if (search.isPending) {
    return <div aria-hidden="true" className="h-[7.5rem] rounded-2xl bg-white sm:h-24" />;
  }
  if (!event) return null;

  return (
    <section
      aria-label={t("home.promo.label")}
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <p className="text-lg font-semibold leading-snug text-[#1A1A18] sm:text-xl">
        {fill(t("home.promo.text"), {
          code: HOME_PROMO.code,
          percent: String(HOME_PROMO.percent),
          event: event.title,
        })}
      </p>
      <Link
        to={`/events/${event.id}`}
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-[10px] bg-[#2448C9] px-5 text-sm font-medium text-white hover:bg-[#1C3AA6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2448C9]"
      >
        {t("home.promo.cta")}
      </Link>
    </section>
  );
}
