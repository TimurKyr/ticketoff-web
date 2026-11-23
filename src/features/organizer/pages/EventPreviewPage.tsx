import { Link, useParams } from "react-router-dom";

import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { EventView } from "@/features/events";
import { useVenue } from "@/features/events/api";
import { ApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/useNow";

import { useMyEvent, useTicketTypes } from "../api";

/**
 * /organizer/events/:eventId/preview — the event as buyers see it, for its organizer.
 *
 * Read from the organizer endpoints, so drafts (which the public API answers 404 for) work,
 * and hidden ticket types are shown greyed. Nothing can be bought, registered or asked here.
 */
export function EventPreviewPage() {
  const { eventId = "" } = useParams();
  const { t } = useI18n();
  const event = useMyEvent(eventId);
  const ticketTypes = useTicketTypes(eventId);
  const venue = useVenue(event.data?.venue_id);
  const now = useNow();
  const editLink = `/organizer/events/${eventId}`;

  if (event.isPending) return <Loading />;
  if (event.isError) {
    const status = event.error instanceof ApiError ? event.error.status : 0;
    return status === 404 || status === 422 ? (
      <EmptyState>
        <p className="mb-2">{t("events.notFound")}</p>
        <Link to="/organizer" className="underline">
          {t("org.back")}
        </Link>
      </EmptyState>
    ) : (
      <ErrorState error={event.error} onRetry={() => event.refetch()} />
    );
  }

  const draft = event.data.status === "draft";
  return (
    <div className="flex flex-col gap-4">
      <div
        role="status"
        className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      >
        <span className="font-medium">{t(draft ? "preview.bannerDraft" : "preview.bannerLive")}</span>
        <Link to={editLink} className="font-medium underline">
          {t("preview.backToEdit")}
        </Link>
      </div>
      <EventView
        event={event.data}
        ticketTypes={ticketTypes}
        venue={venue}
        now={now}
        preview
        backLink={
          <Link to={editLink} className="text-sm underline">
            ← {t("preview.backToEdit")}
          </Link>
        }
      />
    </div>
  );
}
