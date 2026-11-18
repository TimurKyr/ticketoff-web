import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { useVenues } from "@/features/events/api";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { EventStatus } from "@/lib/api/types";
import { DEFAULT_TIME_ZONE, formatDateTime } from "@/lib/format";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { useEventAction, useMyEvent, useTicketTypes, useUpdateEvent, type EventAction } from "../api";
import { ActivationSection } from "../components/ActivationSection";
import { EventForm } from "../components/EventForm";
import { InventorySection } from "../components/InventorySection";
import { StatusBadge } from "../components/StatusBadge";
import { TicketTypesSection } from "../components/TicketTypesSection";

/** Which actions make sense in which status; the API checks the rest (409 → message). */
const ACTIONS: Record<EventStatus, EventAction[]> = {
  draft: ["publish", "duplicate", "cancel"],
  published: ["unpublish", "duplicate", "cancel"],
  cancelled: ["duplicate"],
  completed: ["duplicate"],
};

export function ManageEventPage() {
  const { eventId = "" } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const initialNotice = (location.state as { notice?: MessageKey } | null)?.notice;

  const event = useMyEvent(eventId);
  const venues = useVenues();
  const ticketTypes = useTicketTypes(eventId);
  const update = useUpdateEvent(eventId);
  const action = useEventAction(eventId);
  const [notice, setNotice] = useState<string | null>(initialNotice ? t(initialNotice) : null);
  const [error, setError] = useState<string | null>(null);

  // The notice is read once; clearing the history state stops it from coming back on
  // reload or Back.
  useEffect(() => {
    if (initialNotice) navigate(location.pathname, { replace: true, state: null });
  }, [initialNotice, location.pathname, navigate]);

  if (event.isPending || venues.isPending) return <Loading />;
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
  if (venues.isError) return <ErrorState error={venues.error} onRetry={() => venues.refetch()} />;

  const data = event.data;
  const venue = venues.data.find((v) => v.id === data.venue_id);
  const tz = venue?.timezone ?? DEFAULT_TIME_ZONE;
  const open = data.status === "draft" || data.status === "published";
  const hasPaid = ticketTypes.data?.some((type) => type.kind === "paid") ?? false;

  async function run(name: EventAction) {
    if (name === "cancel" && !window.confirm(t("org.actions.cancelConfirm"))) return;
    setError(null);
    setNotice(null);
    try {
      const result = await action.mutateAsync(name);
      if (name === "duplicate") {
        // Same route, same component: set the notice here, not via navigation state.
        setNotice(t("org.actions.done.duplicate"));
        navigate(`/organizer/events/${result.id}`);
      } else {
        setNotice(t(`org.actions.done.${name}`));
      }
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    // key: the edit form re-reads the event after a duplicate opens another one
    <article key={data.id} className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link to="/organizer" className="text-sm underline">
        ← {t("org.back")}
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={data.status} />
          <span className="text-sm text-gray-700">{t(`visibility.${data.visibility}`)}</span>
        </div>
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <p className="text-sm text-gray-700">
          {formatDateTime(data.start_at, lang, tz)}
          {venue ? ` · ${venue.name}` : ""}
        </p>
        {data.status === "published" && data.visibility !== "private" && (
          <Link to={`/events/${data.id}`} className="text-sm underline">
            {t("org.openPublic")}
          </Link>
        )}
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("org.manage")}>
        {ACTIONS[data.status].map((name) => (
          <Button
            key={name}
            variant={name === "publish" ? "primary" : name === "cancel" ? "ghost" : "secondary"}
            onClick={() => run(name)}
            disabled={action.isPending}
            className={name === "cancel" ? "text-red-800" : ""}
          >
            {t(`org.actions.${name}`)}
          </Button>
        ))}
      </div>
      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <TicketTypesSection eventId={data.id} tz={tz} editable={open} />
      {data.status !== "draft" && <InventorySection eventId={data.id} />}
      {hasPaid && <ActivationSection eventId={data.id} editable={open} />}

      <section className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
        <h2 className="text-xl font-semibold">{t("org.form.editTitle")}</h2>
        <EventForm
          venues={venues.data}
          event={data}
          submitLabel={t("org.form.save")}
          savedText={t("org.form.saved")}
          disabled={!open}
          onSubmit={(payload) => update.mutateAsync(payload)}
        />
      </section>
    </article>
  );
}
