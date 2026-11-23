import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { ErrorState, Loading } from "@/components/ui/States";
import { VerifyEmailNotice } from "@/features/auth";
import { HelpButton } from "@/features/support";
import type { EventOut, PublicTicketTypeOut, TicketKind, VenueOut } from "@/lib/api/types";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { FEW_LEFT, registrationState, salesState } from "../availability";
import { AddToCalendar } from "./AddToCalendar";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { EventCover } from "./EventCover";
import { TicketOrderForm } from "./TicketOrderForm";

/** A ticket type as the event page shows it; the organizer's preview also knows hidden ones. */
export type ViewTicketType = PublicTicketTypeOut & { is_hidden?: boolean };

export interface TicketTypesState {
  data?: ViewTicketType[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

function TicketTypeRow({
  type,
  now,
  timeZone,
}: {
  type: ViewTicketType;
  now: number;
  timeZone?: string;
}) {
  const { t, lang } = useI18n();
  const sales = salesState(type, now);
  return (
    <li
      className={`flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 py-3 last:border-0 ${
        type.is_hidden ? "text-gray-500" : ""
      }`}
    >
      <div>
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {type.name}
          {type.is_hidden && (
            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
              {t("preview.hiddenType")}
            </span>
          )}
          {type.available > 0 && type.available <= FEW_LEFT && sales !== "ended" && (
            <span className="rounded bg-[#FCF1D9] px-2 py-0.5 text-xs font-medium text-[#7A4D00]">
              {t("events.fewLeftType")}
            </span>
          )}
        </p>
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
  types: ViewTicketType[];
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

/** "Организатор: name" with a mailto link (never the phone). */
function OrganizerLine({ event }: { event: EventOut }) {
  const { t } = useI18n();
  const organizer = event.organizer;
  if (!organizer) return null;
  return (
    <>
      <dt className="text-gray-600">{t("events.organizer")}</dt>
      <dd>
        {organizer.display_name}
        {organizer.contact_email && (
          <>
            {" · "}
            <a href={`mailto:${organizer.contact_email}`} className="underline">
              {organizer.contact_email}
            </a>
          </>
        )}
      </dd>
    </>
  );
}

/**
 * The public event page's content. `preview` is the organizer's look at it (any status,
 * hidden types included): no buying, registering, help or promo controls at all.
 */
export function EventView({
  event: data,
  ticketTypes,
  venue,
  now,
  preview = false,
  backLink,
  notices,
  linkPromoCode,
}: {
  event: EventOut;
  ticketTypes: TicketTypesState;
  venue?: VenueOut;
  now: number;
  preview?: boolean;
  backLink: ReactNode;
  /** Shown under the header (cancelled notice, promo link notices). */
  notices?: ReactNode;
  linkPromoCode?: string | null;
}) {
  const { t, lang } = useI18n();
  const cancelled = data.status === "cancelled";
  const types = ticketTypes.data ?? [];
  // Same checks as the API: event-level registration window, then per-type sales window and stock.
  const registration = registrationState(data, now);
  const soldOut = types.length > 0 && types.every((type) => type.available <= 0);
  const ended = Date.parse(data.end_at ?? data.start_at) <= now;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      {backLink}

      <header className="flex flex-col gap-3">
        {/* The cover shows the translated category; the title stays in the h1 below. */}
        <EventCover event={data} variant="banner" />
        <h1 className="text-3xl font-bold">{data.title}</h1>
        {soldOut && !cancelled && (
          <div>
            <AvailabilityBadge availability="sold_out" />
          </div>
        )}
        {/* Only a published event can be asked about (the API refuses the rest). Nothing to
            act on in the organizer's preview. The calendar menu (FE-16) is for events still
            ahead: an ended event (end_at, or start_at without one) has no use for it. */}
        {!preview && data.status === "published" && (
          <div className="flex flex-wrap gap-2">
            {!ended && <AddToCalendar links={data.calendar_links} />}
            <HelpButton context={{ event_id: data.id }} />
          </div>
        )}
      </header>

      {cancelled && <Alert tone="error">{t("events.cancelled")}</Alert>}
      {notices}

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
        <OrganizerLine event={data} />
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
            {preview ? (
              <p className="text-sm text-gray-700">{t("preview.noBuying")}</p>
            ) : (
              !cancelled &&
              (registration === "started" ? (
                <p className="font-medium">{t("events.regStarted")}</p>
              ) : registration === "closed" ? (
                <p className="font-medium">{t("events.regClosed")}</p>
              ) : registration === "notOpen" && data.registration_opens_at ? (
                <p className="font-medium">
                  {t("events.regNotOpen")}{" "}
                  {formatDateTime(data.registration_opens_at, lang, venue?.timezone)}
                </p>
              ) : (
                <div className="flex flex-col gap-6">
                  <VerifyEmailNotice reason="buy" />
                  <KindOrder event={data} kind="free" types={types} now={now} />
                  <KindOrder
                    event={data}
                    kind="paid"
                    types={types}
                    now={now}
                    linkPromoCode={linkPromoCode}
                  />
                </div>
              ))
            )}
          </>
        )}
      </section>
    </article>
  );
}

export function BackToEvents() {
  const { t } = useI18n();
  return (
    <Link to="/events" className="text-sm underline">
      ← {t("events.backToList")}
    </Link>
  );
}
