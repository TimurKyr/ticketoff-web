import { History } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useI18n } from "@/lib/i18n";

/** "История" of an event (R-109) for the admin; the page's "back" returns here. */
export function HistoryLink({ eventId, title }: { eventId: string; title?: string | null }) {
  const { t } = useI18n();
  const location = useLocation();
  return (
    <Link
      to={`/admin/events/${eventId}/history`}
      state={{ from: `${location.pathname}${location.search}`, title: title ?? null }}
      className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2"
    >
      <History className="h-4 w-4" aria-hidden />
      {t("admin.history.link")}
    </Link>
  );
}
