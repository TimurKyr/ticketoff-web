import { Link, useLocation, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { useEvent, usePublicTicketTypes } from "@/features/events/api";
import { ApiError } from "@/lib/api/client";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useOrder } from "../api";
import { TicketCard } from "../components/TicketCard";

/** One order of the current user with its tickets (QR + PDF). */
export function OrderPage() {
  const { orderId = "" } = useParams();
  const { t, lang } = useI18n();
  const justRegistered = Boolean(
    (useLocation().state as { justRegistered?: boolean } | null)?.justRegistered
  );

  const order = useOrder(orderId);
  const eventId = order.data?.event_id ?? "";
  const event = useEvent(eventId);
  const ticketTypes = usePublicTicketTypes(eventId);

  if (order.isPending) return <Loading />;
  if (order.isError) {
    const status = order.error instanceof ApiError ? order.error.status : 0;
    return status === 404 || status === 422 ? (
      <EmptyState>{t("order.notFound")}</EmptyState>
    ) : (
      <ErrorState error={order.error} onRetry={() => order.refetch()} />
    );
  }

  const data = order.data;
  const typeName = (id: string) => ticketTypes.data?.find((type) => type.id === id)?.name;

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      {justRegistered && <Alert tone="success">{t("order.success")}</Alert>}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{event.data?.title ?? t("order.title")}</h1>
        <p className="text-sm text-gray-700">
          {t("order.status")}: {t(`order.status.${data.status}`)}
          {data.total_kzt > 0 && ` · ${t("order.total")}: ${formatKzt(data.total_kzt, lang)}`}
        </p>
        <Link to={`/events/${data.event_id}`} className="text-sm underline">
          {t("order.toEvent")}
        </Link>
      </header>
      <ul className="flex flex-col gap-4">
        {data.tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} ticketTypeName={typeName(ticket.ticket_type_id)} />
        ))}
      </ul>
    </section>
  );
}
