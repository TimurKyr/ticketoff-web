import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import { useEvent } from "@/features/events/api";
import { HistoryTab } from "@/features/organizer-event/history/HistoryTab";
import { DEFAULT_TIME_ZONE } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

interface FromState {
  from?: string;
  title?: string | null;
}

/**
 * Audit timeline of any event for a platform admin (R-109, GET /events/{id}/timeline):
 * the organizer's «История» tab, opened from the admin search and reports.
 */
export function AdminEventHistoryPage() {
  const { t } = useI18n();
  const { eventId = "" } = useParams();
  const state = (useLocation().state ?? {}) as FromState;
  // The title comes with the link; a public event is also looked up (a draft is not public).
  const event = useEvent(state.title ? "" : eventId);
  const title = state.title ?? event.data?.title ?? eventId.slice(0, 8);
  const back = state.from?.startsWith("/admin") ? state.from : "/admin";

  useDocumentTitle(`${t("admin.history.title")}: ${title}`);

  return (
    <div className="flex flex-col gap-4">
      <Link to={back} className="inline-flex items-center gap-1 text-sm text-gray-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("admin.history.back")}
      </Link>
      {/* The tab below has its own «История события» heading. */}
      <h1 className="text-xl font-semibold">{title}</h1>
      {/* Kazakhstan has one time zone; the organizer page uses the venue's, the same here. */}
      <HistoryTab eventId={eventId} tz={DEFAULT_TIME_ZONE} />
    </div>
  );
}
