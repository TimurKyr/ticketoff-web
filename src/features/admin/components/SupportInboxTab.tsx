import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { SelectField } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { CaseStatusBadge, SUPPORT_PAGE_SIZE, useInbox } from "@/features/support";
import {
  CATEGORY_LABELS,
  isSupportStatus,
  KIND_LABELS,
  STATUSES,
  statusLabel,
} from "@/features/support/labels";
import type { SupportKind, SupportStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { pageCount } from "@/lib/pagination";

import { EventCell } from "./EventCell";

// Reports (kind=report) have their own tab «Жалобы».
const KINDS: SupportKind[] = ["organizer", "attendee"];

/** «Обращения» (R-126, R-128): support cases addressed to the platform, oldest first. */
export function SupportInboxTab() {
  const { t, lang } = useI18n();
  const location = useLocation();
  const [kind, setKind] = useState<SupportKind>("organizer");
  const [status, setStatus] = useState<SupportStatus | null>(null);
  const [page, setPage] = useState(1);
  const inbox = useInbox(status, kind, page);
  const pages = pageCount(inbox.data?.total ?? 0, SUPPORT_PAGE_SIZE);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-64">
          <SelectField
            label={t("admin.inbox.kind")}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as SupportKind);
              setPage(1);
            }}
          >
            {KINDS.map((value) => (
              <option key={value} value={value}>
                {t(KIND_LABELS[value])}
              </option>
            ))}
          </SelectField>
        </div>
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
      </div>

      {inbox.isPending ? (
        <Loading />
      ) : inbox.isError ? (
        <ErrorState error={inbox.error} onRetry={() => inbox.refetch()} />
      ) : inbox.data.items.length === 0 ? (
        <EmptyState>{t(status ? "support.inbox.emptyFiltered" : "admin.inbox.empty")}</EmptyState>
      ) : (
        <>
          <ul
            aria-busy={inbox.isPlaceholderData}
            className={`flex flex-col gap-2 transition-opacity ${
              inbox.isPlaceholderData ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {inbox.data.items.map((item) => (
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
                  {item.event_id && (
                    <div className="text-sm text-gray-700">
                      <EventCell id={item.event_id} title={item.event_title} />
                    </div>
                  )}
                  <time dateTime={item.created_at} className="text-sm text-gray-600">
                    {formatDateTime(item.created_at, lang)}
                  </time>
                </div>
                <Link
                  to={`/support/cases/${item.id}`}
                  // The case page's "back" returns to this tab.
                  state={{ from: `${location.pathname}${location.search}` }}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2"
                >
                  {t("support.form.open")}
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={page} pages={pages} busy={inbox.isPlaceholderData} onPage={setPage} />
        </>
      )}
    </section>
  );
}
