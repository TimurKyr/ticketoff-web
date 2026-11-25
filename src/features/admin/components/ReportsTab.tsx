import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { CaseStatusBadge, SUPPORT_PAGE_SIZE, useInbox } from "@/features/support";
import { CATEGORY_LABELS, isSupportStatus, STATUSES, statusLabel } from "@/features/support/labels";
import { errorMessage } from "@/lib/api/errors";
import type { CaseOut, SupportStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { pageCount } from "@/lib/pagination";

import { useSuspendEvent } from "../hooks/useSuspension";
import { ConfirmDialog } from "./ConfirmDialog";
import { EventCell } from "./EventCell";

/** Admin tab «Жалобы» (FE-15): event reports, oldest first, with a quick "suspend the event". */
export function ReportsTab() {
  const { t, lang } = useI18n();
  const location = useLocation();
  const [status, setStatus] = useState<SupportStatus | null>(null);
  const [page, setPage] = useState(1);
  const reports = useInbox(status, "report", page);
  const pages = pageCount(reports.data?.total ?? 0, SUPPORT_PAGE_SIZE);

  const suspend = useSuspendEvent();
  const [target, setTarget] = useState<CaseOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Events suspended from this tab, so the button is not offered twice.
  const [suspended, setSuspended] = useState<ReadonlySet<string>>(new Set());

  function closeDialog() {
    setTarget(null);
    setError(null);
  }

  async function confirm() {
    const eventId = target?.event_id;
    if (!eventId) return;
    setError(null);
    try {
      await suspend.mutateAsync({ id: eventId, suspend: true });
      setSuspended((prev) => new Set(prev).add(eventId));
      setTarget(null);
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="w-full sm:w-64">
        <SelectField
          label={t("support.filter.status")}
          value={status ?? ""}
          onChange={(e) => {
            setStatus(isSupportStatus(e.target.value) ? e.target.value : null);
            setPage(1);
          }}
        >
          <option value="">{t("support.filter.all")}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(statusLabel(value, true))}
            </option>
          ))}
        </SelectField>
      </div>

      {reports.isPending ? (
        <Loading />
      ) : reports.isError ? (
        <ErrorState error={reports.error} onRetry={() => reports.refetch()} />
      ) : reports.data.items.length === 0 ? (
        <EmptyState>{t(status ? "support.inbox.emptyFiltered" : "admin.reports.empty")}</EmptyState>
      ) : (
        <>
          <ul
            aria-busy={reports.isPlaceholderData}
            className={`flex flex-col gap-2 transition-opacity ${
              reports.isPlaceholderData ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {reports.data.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 rounded-lg border border-gray-300 p-4"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CaseStatusBadge status={item.status} asHandler />
                    <span className="font-semibold">{t(CATEGORY_LABELS[item.category])}</span>
                  </div>
                  <p className="break-all text-sm">{item.opener_email}</p>
                  <div className="text-sm text-gray-700">
                    <EventCell id={item.event_id ?? null} title={item.event_title} />
                  </div>
                  <time dateTime={item.created_at} className="text-sm text-gray-600">
                    {formatDateTime(item.created_at, lang)}
                  </time>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/support/cases/${item.id}`}
                    // The case page's "back" returns to this tab.
                    state={{ from: `${location.pathname}${location.search}` }}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2"
                  >
                    {t("support.form.open")}
                  </Link>
                  {item.event_id &&
                    (suspended.has(item.event_id) ? (
                      <span className="text-sm text-gray-700">{t("admin.reports.suspended")}</span>
                    ) : (
                      <Button type="button" variant="secondary" onClick={() => setTarget(item)}>
                        {t("admin.reports.suspend")}
                      </Button>
                    ))}
                </div>
              </li>
            ))}
          </ul>
          <Pager page={page} pages={pages} busy={reports.isPlaceholderData} onPage={setPage} />
        </>
      )}

      <ConfirmDialog
        open={target !== null}
        title={t("admin.reports.suspendTitle")}
        description={t("admin.reports.suspendDesc")}
        confirmLabel={t("admin.reports.suspend")}
        isPending={suspend.isPending}
        error={error}
        onConfirm={confirm}
        onCancel={closeDialog}
      />
    </section>
  );
}