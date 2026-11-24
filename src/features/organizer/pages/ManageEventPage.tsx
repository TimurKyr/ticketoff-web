import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { useAuth, VerifyEmailNotice } from "@/features/auth";
import { useVenues } from "@/features/events/api";
import { SalesSuspendedBanner } from "@/features/events/components/SalesSuspendedBanner";
import { eventPath } from "@/features/events/paths";
import { EventTabs, isEventOver } from "@/features/organizer-event";
import { PromotionsSection } from "@/features/promotions";
import { ApiError } from "@/lib/api/client";
import { errorMessage, isEmailNotVerified } from "@/lib/api/errors";
import type { EventStatus } from "@/lib/api/types";
import { DEFAULT_TIME_ZONE, formatDateTime } from "@/lib/format";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useNow } from "@/lib/useNow";

import { useEventAction, useMyEvent, useTicketTypes, useUpdateEvent, type EventAction } from "../api";
import { ActivationSection } from "../components/ActivationSection";
import { CancelEventDialog } from "../components/CancelEventDialog";
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

// The tabs other than «Событие» are loaded when first opened (the analytics one brings
// recharts), so pages that never show them do not download them.
const OrdersTab = lazy(() =>
  import("@/features/organizer-event/orders/OrdersTab").then((m) => ({ default: m.OrdersTab }))
);
const AnalyticsTab = lazy(() =>
  import("@/features/organizer-event/analytics/AnalyticsTab").then((m) => ({ default: m.AnalyticsTab }))
);
const HistoryTab = lazy(() =>
  import("@/features/organizer-event/history/HistoryTab").then((m) => ({ default: m.HistoryTab }))
);
const StaffTab = lazy(() =>
  import("@/features/organizer-event/staff/StaffTab").then((m) => ({ default: m.StaffTab }))
);

const TABS = ["event", "orders", "analytics", "history", "staff"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, MessageKey> = {
  event: "orgEvent.tab.event",
  orders: "orgEvent.tab.orders",
  analytics: "orgEvent.tab.analytics",
  history: "orgEvent.tab.history",
  staff: "orgEvent.tab.staff",
};
const isTab = (value: string | null): value is Tab => (TABS as readonly (string | null)[]).includes(value);

/**
 * Keyed by the event id: opening another event (e.g. the copy after "Дублировать", or Back
 * from it) starts with a fresh page, so no notice, error or form state carries over.
 */
export function ManageEventPage() {
  const { eventId = "" } = useParams();
  return <ManageEvent key={eventId} eventId={eventId} />;
}

function ManageEvent({ eventId }: { eventId: string }) {
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const rawTab = params.get("tab");
  const tab: Tab = isTab(rawTab) ? rawTab : "event";
  const now = useNow();
  const { user, refresh } = useAuth();
  // The server refused to publish with EMAIL_NOT_VERIFIED although /auth/me said confirmed.
  const [refusedUnverified, setRefusedUnverified] = useState(false);
  const emailVerified = user?.email_verified;
  useEffect(() => setRefusedUnverified(false), [emailVerified]);

  // The notice is read once; clearing the history state stops it from coming back on
  // reload or Back. The query (the open tab) stays.
  useEffect(() => {
    if (initialNotice)
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [initialNotice, location.pathname, location.search, navigate]);

  /** Another tab: only ?tab changes; each tab's own filters start fresh. */
  function openTab(next: Tab) {
    setParams(next === "event" ? {} : { tab: next });
  }

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
  // The new tabs (orders, staff) are read-only on a past or cancelled event (R-20).
  const over = isEventOver(data, now);

  async function run(name: EventAction, reason?: string | null) {
    setError(null);
    setNotice(null);
    setRefusedUnverified(false);
    try {
      const result = await action.mutateAsync({ name, reason });
      if (name === "duplicate") {
        // The copy's page shows the notice, like a newly created event.
        navigate(`/organizer/events/${result.id}`, { state: { notice: "org.actions.done.duplicate" } });
      } else {
        setNotice(t(`org.actions.done.${name}`));
      }
    } catch (err) {
      if (isEmailNotVerified(err)) {
        setRefusedUnverified(true);
        void refresh();
        return;
      }
      setError(errorMessage(err, t));
    } finally {
      setCancelOpen(false);
    }
  }

  // Early hint only (the server checks again): publishing needs a confirmed email.
  const publishLocked = data.status === "draft" && user?.email_verified === false;

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-5">
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
          <Link to={eventPath(data)} className="text-sm underline">
            {t("org.openPublic")}
          </Link>
        )}
      </header>

      {data.sales_suspended && open && <SalesSuspendedBanner audience="organizer" />}
      {data.status === "draft" && <VerifyEmailNotice reason="publish" force={refusedUnverified} />}

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("org.manage")}>
        {ACTIONS[data.status].map((name) => (
          <Button
            key={name}
            variant={name === "publish" ? "primary" : name === "cancel" ? "ghost" : "secondary"}
            onClick={() => (name === "cancel" ? setCancelOpen(true) : run(name))}
            disabled={action.isPending || (name === "publish" && publishLocked)}
            aria-describedby={name === "publish" && publishLocked ? "publish-verify-hint" : undefined}
            className={name === "cancel" ? "text-red-800" : ""}
          >
            {t(`org.actions.${name}`)}
          </Button>
        ))}
      </div>
      {publishLocked && (
        <p id="publish-verify-hint" className="text-sm text-amber-900">
          {t("verifyEmail.hint.publish")}
        </p>
      )}
      {cancelOpen && (
        <CancelEventDialog
          title={data.title}
          pending={action.isPending}
          onConfirm={(reason) => void run("cancel", reason)}
          onClose={() => setCancelOpen(false)}
        />
      )}
      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <EventTabs
        label={t("orgEvent.tabs")}
        tabs={TABS.map((id) => ({ id, label: t(TAB_LABELS[id]) }))}
        active={tab}
        onChange={openTab}
      >
        {tab === "event" && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-end">
              <Link
                to={`/organizer/events/${data.id}/preview`}
                className="rounded border border-gray-400 px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
              >
                {t("preview.open")}
              </Link>
            </div>
            <TicketTypesSection eventId={data.id} tz={tz} editable={open} />
            {data.status !== "draft" && <InventorySection eventId={data.id} />}
            {hasPaid && <ActivationSection eventId={data.id} editable={open} />}
            <PromotionsSection eventId={data.id} tz={tz} editable={open} />

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
          </div>
        )}
        <Suspense fallback={<Loading />}>
          {tab === "orders" && <OrdersTab eventId={data.id} tz={tz} readOnly={over} />}
          {tab === "analytics" && <AnalyticsTab eventId={data.id} />}
          {tab === "history" && <HistoryTab eventId={data.id} tz={tz} />}
          {tab === "staff" && <StaffTab eventId={data.id} readOnly={over} />}
        </Suspense>
      </EventTabs>
    </article>
  );
}
