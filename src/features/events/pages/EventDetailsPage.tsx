import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { usePromoQr } from "@/features/checkout";
import { trackCampaignOpen, track } from "@/lib/analytics";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/useNow";

import { useEvent, usePublicTicketTypes, useVenue } from "../api";
import { BackToEvents, EventView } from "../components/EventView";
import { getPromoToken, savePromoToken } from "../promo";

function isNotFound(error: unknown): boolean {
  // 422: the id in the URL is not a UUID
  return error instanceof ApiError && (error.status === 404 || error.status === 422);
}

export function EventDetailsPage() {
  const { eventId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { t } = useI18n();

  const event = useEvent(eventId);
  const ticketTypes = usePublicTicketTypes(eventId);
  const venue = useVenue(event.data?.venue_id);
  const now = useNow();

  const promo = params.get("promo")?.trim() || null;
  // The token from the link, or one saved earlier in this tab (before a login, say).
  const promoToken = promo ?? getPromoToken(eventId);
  // The event whose page was opened from a campaign link, kept after the token leaves the URL.
  const [linkEventId, setLinkEventId] = useState<string | null>(promo ? eventId : null);
  const openedFromLink = Boolean(promo) || linkEventId === eventId;
  useEffect(() => {
    // Counted before the token leaves the URL (it reads utm_* and whether ?promo= was there).
    trackCampaignOpen(eventId, params);
    // Once per opened link: params are read only when the event changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);
  useEffect(() => {
    if (!promo || !savePromoToken(eventId, promo)) return;
    // Saved for this tab: the token leaves the address bar, so it is not copied along with the
    // link or seen by analytics. If it could not be saved, it stays in the URL.
    setLinkEventId(eventId);
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("promo");
        return next;
      },
      { replace: true }
    );
  }, [eventId, promo, setParams]);
  const loadedId = event.data?.id;
  const category = event.data?.category;
  useEffect(() => {
    if (loadedId) track("view_item", { item_id: loadedId, item_category: category ?? undefined });
  }, [loadedId, category]);
  const promoQr = usePromoQr(promoToken);
  // A code of another event is not offered here.
  const linkPromoCode = promoQr.data?.event_id === eventId ? promoQr.data.code : null;

  if (event.isPending) return <Loading />;
  if (event.isError) {
    return isNotFound(event.error) ? (
      <EmptyState>
        <p className="mb-2">{t("events.notFound")}</p>
        <Link to="/events" className="underline">
          {t("events.backToList")}
        </Link>
      </EmptyState>
    ) : (
      <ErrorState error={event.error} onRetry={() => event.refetch()} />
    );
  }

  return (
    <EventView
      event={event.data}
      ticketTypes={ticketTypes}
      venue={venue}
      now={now}
      backLink={<BackToEvents />}
      linkPromoCode={linkPromoCode}
      notices={
        <>
          {linkPromoCode && (
            <Alert tone="info">
              {t("events.promoFromLink")} <strong className="font-mono">{linkPromoCode}</strong>
            </Alert>
          )}
          {/* Only for the link just opened, not for a token remembered from earlier. */}
          {openedFromLink && promoQr.isError && (
            <Alert tone="error">
              {t("events.promoLinkInvalid")} {errorMessage(promoQr.error, t)}
            </Alert>
          )}
        </>
      }
    />
  );
}
