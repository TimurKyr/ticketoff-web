import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { ApiError } from "@/lib/api/client";
import type { PublicTicketTypeOut } from "@/lib/api/types";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useEvent, usePublicTicketTypes, useVenue } from "../api";
import { RegistrationForm } from "../components/RegistrationForm";
import { savePromoToken } from "../promo";

function isNotFound(error: unknown): boolean {
  // 422: the id in the URL is not a UUID
  return error instanceof ApiError && (error.status === 404 || error.status === 422);
}

function TicketTypeRow({ type }: { type: PublicTicketTypeOut }) {
  const { t, lang } = useI18n();
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 py-3 last:border-0">
      <div>
        <p className="font-medium">{type.name}</p>
        {type.description && <p className="text-sm text-gray-700">{type.description}</p>}
        {type.max_per_order && (
          <p className="text-xs text-gray-600">
            {t("events.maxPerOrder")} {type.max_per_order} {t("events.perOrder")}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="font-semibold">
          {type.kind === "free" ? t("events.free") : formatKzt(type.price_kzt, lang)}
        </p>
        <p className="text-sm text-gray-700">
          {type.available > 0 ? `${t("events.available")}: ${type.available}` : t("events.soldOut")}
        </p>
      </div>
    </li>
  );
}

export function EventDetailsPage() {
  const { eventId = "" } = useParams();
  const [params] = useSearchParams();
  const { t, lang } = useI18n();

  const event = useEvent(eventId);
  const ticketTypes = usePublicTicketTypes(eventId);
  const venue = useVenue(event.data?.venue_id);

  const promo = params.get("promo");
  useEffect(() => {
    if (promo) savePromoToken(eventId, promo);
  }, [eventId, promo]);

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

  const data = event.data;
  const cancelled = data.status === "cancelled";
  const types = ticketTypes.data ?? [];
  const freeOpen = types.filter((type) => type.kind === "free" && type.available > 0);
  const hasPaid = types.some((type) => type.kind === "paid");

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to="/events" className="text-sm underline">
        ← {t("events.backToList")}
      </Link>

      <header className="flex flex-col gap-2">
        {data.category && (
          <span className="self-start rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
            {data.category}
          </span>
        )}
        <h1 className="text-3xl font-bold">{data.title}</h1>
      </header>

      {cancelled && <Alert tone="error">{t("events.cancelled")}</Alert>}
      {promo && <Alert tone="info">{t("events.promoSaved")}</Alert>}

      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
        <dt className="text-gray-600">{t("events.when")}</dt>
        <dd>
          <time dateTime={data.start_at}>
            {formatDateTime(data.start_at, lang, venue?.timezone)}
          </time>
          {data.end_at && (
            <>
              {" "}
              {t("events.until")}{" "}
              <time dateTime={data.end_at}>
                {formatDateTime(data.end_at, lang, venue?.timezone)}
              </time>
            </>
          )}
        </dd>
        {venue && (
          <>
            <dt className="text-gray-600">{t("events.where")}</dt>
            <dd>
              {venue.name}
              {venue.address ? `, ${venue.address}` : ""}
              {venue.city ? `, ${venue.city}` : ""}
            </dd>
          </>
        )}
      </dl>

      {data.description && <p className="whitespace-pre-line leading-relaxed">{data.description}</p>}

      <section className="flex flex-col gap-4 rounded-lg border border-gray-300 p-4">
        <h2 className="text-xl font-semibold">{t("events.tickets")}</h2>
        {ticketTypes.isPending ? (
          <Loading />
        ) : ticketTypes.isError ? (
          <ErrorState error={ticketTypes.error} onRetry={() => ticketTypes.refetch()} />
        ) : types.length === 0 ? (
          <p className="text-gray-700">{t("events.noTickets")}</p>
        ) : (
          <>
            <ul>
              {types.map((type) => (
                <TicketTypeRow key={type.id} type={type} />
              ))}
            </ul>
            {hasPaid && <p className="text-sm text-gray-700">{t("events.paidSoon")}</p>}
            {!cancelled && freeOpen.length > 0 && (
              <RegistrationForm eventId={eventId} ticketTypes={freeOpen} />
            )}
          </>
        )}
      </section>
    </article>
  );
}
