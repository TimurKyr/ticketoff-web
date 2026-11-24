import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { VerifyEmailNotice } from "@/features/auth";
import { useVenues } from "@/features/events/api";
import { SalesSuspendedBadge } from "@/features/events/components/SalesSuspendedBanner";
import { EventHistoryList, OverviewCards, useOrganizerOverview } from "@/features/organizer-event";
import { HelpButton } from "@/features/support";
import type { EventBucket } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { pageCount, parsePage } from "@/lib/pagination";

import { ORGANIZER_PAGE_SIZE, useMyEvents } from "../api";
import { OrganizerOnboarding } from "../components/OrganizerOnboarding";
import { StatusBadge } from "../components/StatusBadge";

const BUCKETS: EventBucket[] = ["upcoming", "active", "completed", "cancelled"];

/** "My events" by tab (?tab=upcoming|active|completed|cancelled&page=N). */
export function OrganizerDashboardPage() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const bucket = (BUCKETS as string[]).includes(params.get("tab") ?? "")
    ? (params.get("tab") as EventBucket)
    : "upcoming";
  const page = parsePage(params.get("page"));
  const events = useMyEvents(bucket, (page - 1) * ORGANIZER_PAGE_SIZE);
  const venues = useVenues();
  const pages = pageCount(events.data?.total ?? 0, ORGANIZER_PAGE_SIZE);
  // No events at all yet (drafts count): the three first steps instead of a page of zeros.
  const overview = useOrganizerOverview();
  const firstVisit = overview.data?.events.total === 0;

  // A page past the end (?page=999, or events moved to another tab) moves to the last page.
  const loaded = events.isSuccess && !events.isPlaceholderData;
  useEffect(() => {
    if (!loaded || page <= pages) return;
    setParams(
      { ...(bucket !== "upcoming" && { tab: bucket }), ...(pages > 1 && { page: String(pages) }) },
      { replace: true }
    );
  }, [loaded, page, pages, bucket, setParams]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("org.title")}</h1>
        <HelpButton kind="organizer" label="support.helpPlatform" className="sm:ml-auto" />
        <Link
          to="/organizer/events/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + {t("org.create")}
        </Link>
      </div>

      <VerifyEmailNotice reason="publish" />
      {firstVisit ? <OrganizerOnboarding /> : <OverviewCards />}

      <nav aria-label={t("org.title")} className="flex flex-wrap gap-2 border-b border-gray-300">
        {BUCKETS.map((b) => (
          <button
            key={b}
            type="button"
            aria-current={b === bucket ? "page" : undefined}
            onClick={() => setParams(b === "upcoming" ? {} : { tab: b })}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              b === bucket ? "border-black font-semibold" : "border-transparent text-gray-700 hover:text-black"
            }`}
          >
            {t(`org.bucket.${b}`)}
          </button>
        ))}
      </nav>

      {events.isPending ? (
        <Loading />
      ) : events.isError ? (
        <ErrorState error={events.error} onRetry={() => events.refetch()} />
      ) : events.data.items.length === 0 ? (
        <EmptyState>{t("org.empty")}</EmptyState>
      ) : (
        <>
          {/* While the next page loads, the previous one stays but is dimmed and marked busy. */}
          <ul
            aria-busy={events.isPlaceholderData}
            className={`flex flex-col gap-2 transition-opacity ${
              events.isPlaceholderData ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {events.data.items.map((event) => {
              const venue = venues.data?.find((v) => v.id === event.venue_id);
              return (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-300 p-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={event.status} />
                      {event.sales_suspended && event.status === "published" && <SalesSuspendedBadge />}
                      <span className="font-semibold">{event.title}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {formatDateTime(event.start_at, lang, venue?.timezone)}
                      {venue ? ` · ${venue.name}` : ""}
                    </p>
                  </div>
                  <Link to={`/organizer/events/${event.id}`} className="text-sm font-medium underline">
                    {t("org.manage")}
                  </Link>
                </li>
              );
            })}
          </ul>
          {pages > 1 && (
            <nav aria-label={t("events.page")} className="flex items-center gap-3">
              <Button
                variant="secondary"
                disabled={page <= 1 || events.isPlaceholderData}
                onClick={() => setParams({ ...(bucket !== "upcoming" && { tab: bucket }), page: String(page - 1) })}
              >
                {t("events.prev")}
              </Button>
              <span className="text-sm">
                {t("events.page")} {page} {t("events.of")} {pages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= pages || events.isPlaceholderData}
                onClick={() => setParams({ ...(bucket !== "upcoming" && { tab: bucket }), page: String(page + 1) })}
              >
                {t("events.next")}
              </Button>
            </nav>
          )}
        </>
      )}

      <EventHistoryList />
    </section>
  );
}
