import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { useHomeEvents, useVenues } from "@/features/events/api";
import { categoryLabelKey } from "@/features/events/categories";
import { setCity, useCity } from "@/features/events/city";
import { DateChips } from "@/features/events/components/DateChips";
import { useI18n } from "@/lib/i18n";

import { EventRow, EventRowSkeleton } from "../components/EventRow";
import { PromoBanner } from "../components/PromoBanner";
import { buildRows, type HomeRow } from "../rows";

// Home (brief §7a): one banner, date chips, up to four rows of real events. Everything is
// filtered by the city from the header.
export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const city = useCity();
  const events = useHomeEvents(city);
  const venues = useVenues();
  const rows = useMemo(() => buildRows(events.data?.items ?? []), [events.data]);

  function rowTitle(row: HomeRow): string {
    if (row.kind === "upcoming") return t("home.row.upcoming");
    if (row.kind === "free") return t("home.row.free");
    return t(categoryLabelKey(row.category));
  }

  function rowLink(row: HomeRow): string | undefined {
    if (row.kind === "upcoming") return "/events";
    if (row.kind === "category") return `/events?category=${encodeURIComponent(row.category)}`;
    return undefined; // the API has no "free only" filter
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <h1 className="sr-only">{t("home.title")}</h1>
      <PromoBanner />
      <DateChips
        from=""
        to=""
        onChange={(range) => {
          if (range) navigate(`/events?from=${range.from}&to=${range.to}`);
        }}
      />

      {events.isPending ? (
        <>
          <p role="status" className="sr-only">
            {t("common.loading")}
          </p>
          <EventRowSkeleton />
          <EventRowSkeleton />
        </>
      ) : events.isError ? (
        <ErrorState error={events.error} onRetry={() => events.refetch()} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-white p-6">
          <p className="font-medium text-[#1A1A18]">
            {city ? t("home.emptyCity").replace("{city}", city) : t("home.empty")}
          </p>
          {city && (
            <Button variant="secondary" onClick={() => setCity("")}>
              {t("city.all")}
            </Button>
          )}
        </div>
      ) : (
        rows.map((row) => (
          <EventRow
            key={row.kind === "category" ? row.category : row.kind}
            title={rowTitle(row)}
            moreTo={rowLink(row)}
            events={row.events}
            venues={venues.data}
          />
        ))
      )}
    </div>
  );
}
