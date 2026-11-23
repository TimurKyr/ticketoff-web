import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

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
import { slugRedirect } from "../paths";
import { getPromoToken, savePromoToken } from "../promo";

function isNotFound(error: unknown): boolean {
  // 422: the key in the URL is not a valid id or slug (too long)
  return error instanceof ApiError && (error.status === 404 || error.status === 422);
}

export function EventDetailsPage() {
  // /events/:key, key = the slug or the id (BE-35).
  const { key = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const event = useEvent(key);
  // Everything below works on the id, whichever key the page was opened with.
  const eventId = event.data?.id ?? "";
  const ticketTypes = usePublicTicketTypes(eventId);
  const venue = useVenue(event.data?.venue_id);
  const now = useNow();

  const promo = params.get("promo")?.trim() || null;
  // The token from the link, or one saved earlier in this tab (before a login, say).
  const promoToken = promo ?? (eventId ? getPromoToken(eventId) : null);
  // The event whose page was opened from a campaign link, kept after the token leaves the URL.
  const [linkEventId, setLinkEventId] = useState<string | null>(null);
  const openedFromLink = Boolean(promo) || (Boolean(eventId) && linkEventId === eventId);

  // Opened by the id (an old link, a campaign QR) while the event has a slug: move to the
  // slug address with the same query, so ?promo= and utm_* are handled there, once.
  const redirectTo = event.data
    ? slugRedirect(key, event.data, location.search, location.hash)
    : null;
  useEffect(() => {
    if (!redirectTo || !event.data?.slug) return;
    // The slug page shows the event already loaded instead of fetching it again.
    queryClient.setQueryData(["events", "detail", event.data.slug], event.data);
    navigate(redirectTo, { replace: true, state: location.state });
  }, [redirectTo, event.data, queryClient, navigate, location.state]);

  useEffect(() => {
    if (!eventId || redirectTo) return;
    // Counted before the token leaves the URL (it reads utm_* and whether ?promo= was there).
    trackCampaignOpen(eventId, params);
    // Once per opened link: params are read only when the event changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, redirectTo]);
  useEffect(() => {
    if (!eventId || redirectTo || !promo || !savePromoToken(eventId, promo)) return;
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
  }, [eventId, redirectTo, promo, setParams]);
  const loadedId = event.data?.id;
  const category = event.data?.category;
  useEffect(() => {
    if (loadedId) track("view_item", { item_id: loadedId, item_category: category ?? undefined });
  }, [loadedId, category]);
  const promoQr = usePromoQr(promoToken);
  // A code of another event is not offered here.
  const linkPromoCode = promoQr.data?.event_id === eventId ? promoQr.data.code : null;

  if (event.isPending || redirectTo) return <Loading />;
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
