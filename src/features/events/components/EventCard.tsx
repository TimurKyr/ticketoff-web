import { Link } from "react-router-dom";

import type { EventOut, VenueOut } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function EventCard({ event, venue }: { event: EventOut; venue?: VenueOut }) {
  const { t, lang } = useI18n();
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-gray-300 p-4">
      {event.category && (
        <span className="self-start rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
          {event.category}
        </span>
      )}
      <h2 className="text-lg font-semibold">
        <Link to={`/events/${event.id}`} className="hover:underline">
          {event.title}
        </Link>
      </h2>
      <p className="text-sm text-gray-700">
        <time dateTime={event.start_at}>
          {formatDateTime(event.start_at, lang, venue?.timezone)}
        </time>
      </p>
      {venue && (
        <p className="text-sm text-gray-700">
          {venue.name}
          {venue.city ? `, ${venue.city}` : ""}
        </p>
      )}
      <Link
        to={`/events/${event.id}`}
        className="mt-auto self-start text-sm font-medium underline"
        aria-label={`${t("events.more")}: ${event.title}`}
      >
        {t("events.more")}
      </Link>
    </li>
  );
}
