import { Link } from "react-router-dom";

import type { Availability, EventOut, VenueOut } from "@/lib/api/types";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { formatCardDate } from "../cardDate";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { EventCover } from "./EventCover";

/** "От 5 000 ₸" / "Бесплатно" from price_from; null (nothing on sale) → nothing. */
export function PriceFrom({ price }: { price: number | null | undefined }) {
  const { t, lang } = useI18n();
  if (price === null || price === undefined) return null;
  return (
    <span className="font-medium tabular-nums">
      {price === 0 ? t("events.free") : t("events.priceFrom").replace("{price}", formatKzt(price, lang))}
    </span>
  );
}

// The whole card is one link (no separate "Подробнее"); white on the grey page, no border,
// a border on hover and the focus ring on keyboard focus (design brief §6, §7a).
export function EventCard({
  event,
  venue,
  className = "",
  headingLevel = "h2",
}: {
  event: EventOut;
  venue?: VenueOut;
  className?: string;
  /** h3 inside a titled row on the home page */
  headingLevel?: "h2" | "h3";
}) {
  const { lang } = useI18n();
  const Heading = headingLevel;
  const availability: Availability | null = event.availability ?? null;
  return (
    <li className={className}>
      <Link
        to={`/events/${event.id}`}
        className="flex h-full flex-col gap-2 rounded-2xl bg-white p-3 ring-1 ring-transparent transition-shadow hover:ring-[#8F8C85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2448C9]"
      >
        <EventCover event={event} />
        <p className="px-1 pt-1 text-sm font-medium text-[#1A1A18]">
          <time dateTime={event.start_at}>{formatCardDate(event.start_at, lang, venue?.timezone)}</time>
        </p>
        <Heading className="line-clamp-2 px-1 text-lg font-medium leading-snug text-[#1A1A18]">
          {event.title}
        </Heading>
        {venue && (
          <p className="px-1 text-sm text-[#5E5C57]">
            {venue.name}
            {venue.city ? `, ${venue.city}` : ""}
          </p>
        )}
        {(event.price_from != null || (availability && availability !== "available")) && (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 px-1 pb-1 pt-1 text-sm text-[#1A1A18]">
            <PriceFrom price={availability === "sold_out" ? null : event.price_from} />
            <AvailabilityBadge availability={availability} />
          </div>
        )}
      </Link>
    </li>
  );
}
