import { Link } from "react-router-dom";

import type { EventOut, VenueOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { formatCardDate } from "../cardDate";

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
  return (
    <li className={className}>
      <Link
        to={`/events/${event.id}`}
        className="flex h-full flex-col gap-2 rounded-2xl bg-white p-3 ring-1 ring-transparent transition-shadow hover:ring-[#8F8C85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2448C9]"
      >
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
      </Link>
    </li>
  );
}
