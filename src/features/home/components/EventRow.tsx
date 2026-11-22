import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { EventCard } from "@/features/events/components/EventCard";
import { EventCardSkeleton } from "@/features/events/components/EventCardSkeleton";
import type { EventOut, VenueOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

// Phone: one row scrolled sideways with snap (the next card peeks out). From 768px: a grid.
const list =
  "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 no-scrollbar px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4";
const item = "w-[78%] max-w-[18rem] shrink-0 snap-start md:w-auto md:max-w-none";

function RowShell({ title, moreTo, children }: { title: ReactNode; moreTo?: string; children: ReactNode }) {
  const { t } = useI18n();
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-xl font-semibold text-[#1A1A18]">
          {title}
        </h2>
        {moreTo && (
          <Link to={moreTo} className="shrink-0 text-sm font-medium text-[#1A1A18] underline">
            {t("home.all")} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function EventRow({
  title,
  moreTo,
  events,
  venues,
}: {
  title: string;
  moreTo?: string;
  events: EventOut[];
  venues: VenueOut[] | undefined;
}) {
  return (
    <RowShell title={title} moreTo={moreTo}>
      <ul className={list}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            venue={venues?.find((venue) => venue.id === event.venue_id)}
            className={item}
            headingLevel="h3"
          />
        ))}
      </ul>
    </RowShell>
  );
}

export function EventRowSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="h-7 w-40 rounded bg-white" />
      <ul className={list}>
        {Array.from({ length: 4 }, (_, i) => (
          <EventCardSkeleton key={i} className={`${item} ${i === 3 ? "md:hidden lg:flex" : ""}`} />
        ))}
      </ul>
    </div>
  );
}
