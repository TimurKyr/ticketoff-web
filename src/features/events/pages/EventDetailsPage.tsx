import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { usePromoQr } from "@/features/checkout";
import { HelpButton } from "@/features/support";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { EventOut, PublicTicketTypeOut, TicketKind } from "@/lib/api/types";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/useNow";

import { useEvent, usePublicTicketTypes, useVenue } from "../api";
import { registrationState, salesState } from "../availability";
import { TicketOrderForm } from "../components/TicketOrderForm";
import { getPromoToken, savePromoToken } from "../promo";

function isNotFound(error: unknown): boolean {
  // 422: the id in the URL is not a UUID
  return error instanceof ApiError && (error.status === 404 || error.status === 422);
}

function TicketTypeRow({ type, now, timeZone }: { type: PublicTicketTypeOut; now: number; timeZone?: string }) {
  const { t, lang } = useI18n();
  const sales = salesState(type, now);
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
          {type.available <= 0
            ? t("events.soldOut")
            : sales === "notStarted" && type.sales_start_at
              ? `${t("events.salesFrom")} ${formatDateTime(type.sales_start_at, lang, timeZone)}`
              : sales === "ended"
                ? t("events.salesEnded")
                : `${t("events.available")}: ${type.available}`}
        </p>
      </div>
    </li>
  );
}

/** The order form for one kind of ticket, or why it cannot be used right now. */
function KindOrder({
  event,
  kind,
  types,
  now,
  linkPromoCode,
}: {
  event: EventOut;
  kind: TicketKind;
  types: PublicTicketTypeOut[];
  now: number;
  linkPromoCode?: string | null;
}) {
  const { t } = useI18n();
  const ofKind = types.filter((type) => type.kind === kind);
  const onSale = ofKind.filter((type) => salesState(type, now) === "open");
  const open = onSale.filter((type) => type.available > 0);
  if (ofKind.length === 0) return null;

  // Same order as the API checks: paid sales switched on, then sales windows, then stock.
  let reason: string | null = null;
  if (kind === "paid" && !event.paid_sales_active) reason = t("events.paidNotActive");
  else if (open.length === 0)
    reason =
      onSale.length > 0
        ? t(kind === "free" ? "events.freeSoldOut" : "events.paidSoldOut")
        : t(kind === "free" ? "events.freeNotOnSale" : "events.paidNotOnSale");

  return reason ? (
    <p className="font-medium">{reason}</p>
  ) : (
    <TicketOrderForm
      key={kind}
      eventId={event.id}
      kind={kind}
      ticketTypes={open}
      refundPolicy={event.refund_policy}
      linkPromoCode={kind === "paid" ? linkPromoCode : undefined}
    />
  );
}

export function EventDetailsPage() {
  const { eventId = "" } = useParams();
  const [params] = useSearchParams();
  const { t, lang } = useI18n();

  const event = useEvent(eventId);
  const ticketTypes = usePublicTicketTypes(eventId);
  const venue = useVenue(event.data?.venue_id);
  const now = useNow();

  const promo = params.get("promo")?.trim() || null;
  // The token from the link, or one saved earlier in this tab (before a login, say).
  const promoToken = promo ?? getPromoToken(eventId);
  useEffect(() => {
    if (promo) savePromoToken(eventId, promo);
  }, [eventId, promo]);
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

  const data = event.data;
  const cancelled = data.status === "cancelled";
  const types = ticketTypes.data ?? [];
  // Same checks as the API: event-level registration window, then per-type sales window and stock.
  const registration = registrationState(data, now);

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
        {/* Only a published event can be asked about (the API refuses the rest). */}
        {data.status === "published" && <HelpButton context={{ event_id: data.id }} />}
      </header>

      {cancelled && <Alert tone="error">{t("events.cancelled")}</Alert>}
      {linkPromoCode && (
        <Alert tone="info">
          {t("events.promoFromLink")} <strong className="font-mono">{linkPromoCode}</strong>
        </Alert>
      )}
      {/* Only for the link just opened, not for a token remembered from earlier. */}
      {promo && promoQr.isError && (
        <Alert tone="error">
          {t("events.promoLinkInvalid")} {errorMessage(promoQr.error, t)}
        </Alert>
      )}

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
                <TicketTypeRow key={type.id} type={type} now={now} timeZone={venue?.timezone} />
              ))}
            </ul>
            {!cancelled &&
              (registration === "started" ? (
                <p className="font-medium">{t("events.regStarted")}</p>
              ) : registration === "closed" ? (
                <p className="font-medium">{t("events.regClosed")}</p>
              ) : registration === "notOpen" && data.registration_opens_at ? (
                <p className="font-medium">
                  {t("events.regNotOpen")} {formatDateTime(data.registration_opens_at, lang, venue?.timezone)}
                </p>
              ) : (
                <div className="flex flex-col gap-6">
                  <KindOrder event={data} kind="free" types={types} now={now} />
                  <KindOrder
                    event={data}
                    kind="paid"
                    types={types}
                    now={now}
                    linkPromoCode={linkPromoCode}
                  />
                </div>
              ))}
          </>
        )}
      </section>
    </article>
  );
}
