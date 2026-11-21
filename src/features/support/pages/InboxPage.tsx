import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { SelectField } from "@/components/ui/FormField";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { useAuth } from "@/features/auth";
import type { CaseOut } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { pageCount, parsePage } from "@/lib/pagination";

import { SUPPORT_PAGE_SIZE, useInbox } from "../api";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { Pager } from "../components/Pager";
import {
  CATEGORY_LABELS,
  isSupportKind,
  isSupportStatus,
  KIND_LABELS,
  KINDS,
  statusLabel,
  STATUSES,
} from "../labels";

/** URL params for the filters and page; defaults are left out. */
function search(status: string | null, kind: string | null, page: number) {
  return {
    ...(status && { status }),
    ...(kind && { kind }),
    ...(page > 1 && { page: String(page) }),
  };
}

function assigneeKey(item: CaseOut, userId: string): MessageKey {
  if (!item.assignee_id) return "support.case.unassigned";
  return item.assignee_id === userId ? "support.case.assignedToMe" : "support.case.assignedOther";
}

function InboxRow({ item, userId, showKind }: { item: CaseOut; userId: string; showKind: boolean }) {
  const { t, lang } = useI18n();
  return (
    <li>
      <Link
        to={`/support/cases/${item.id}`}
        className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-lg border border-gray-300 p-4 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CaseStatusBadge status={item.status} asHandler />
            <span className="font-semibold">{t(CATEGORY_LABELS[item.category])}</span>
            {showKind && <span className="text-xs text-gray-600">{t(KIND_LABELS[item.kind])}</span>}
          </div>
          <p className="break-all text-sm">{item.opener_email}</p>
          <p className="text-sm text-gray-700">{item.event_title ?? t("support.case.platform")}</p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-gray-600 sm:items-end">
          <time dateTime={item.created_at}>{formatDateTime(item.created_at, lang)}</time>
          <span>
            {t("support.case.assignee")}: {t(assigneeKey(item, userId))}
          </span>
        </div>
      </Link>
    </li>
  );
}

/**
 * /support/inbox: cases I handle, oldest first (the API's order), so the longest waiting
 * come first. Organizers see their events' attendee cases; platform admins see everything
 * and can filter by kind. (?status=…&kind=…&page=N)
 */
export function InboxPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.system_role === "platform_admin";
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get("status");
  const rawKind = params.get("kind");
  const status = isSupportStatus(rawStatus) ? rawStatus : null;
  // Only admins get attendee and organizer cases mixed; for anyone else the filter is moot.
  const kind = isAdmin && isSupportKind(rawKind) ? rawKind : null;
  const page = parsePage(params.get("page"));
  const cases = useInbox(status, kind, page);
  const pages = pageCount(cases.data?.total ?? 0, SUPPORT_PAGE_SIZE);

  const go = (next: { status?: string | null; kind?: string | null; page?: number }) =>
    setParams(
      search(
        next.status !== undefined ? next.status : status,
        next.kind !== undefined ? next.kind : kind,
        next.page ?? 1
      )
    );

  const loaded = cases.isSuccess && !cases.isPlaceholderData;
  useEffect(() => {
    if (!loaded || page <= pages) return;
    setParams(search(status, kind, pages), { replace: true });
  }, [loaded, page, pages, status, kind, setParams]);

  if (!user) return null; // the route is wrapped in RequireRole

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("support.inbox.title")}</h1>

      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-64">
          <SelectField
            label={t("support.filter.status")}
            value={status ?? ""}
            onChange={(e) => go({ status: e.target.value || null })}
          >
            <option value="">{t("support.filter.all")}</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(statusLabel(value, true))}
              </option>
            ))}
          </SelectField>
        </div>
        {isAdmin && (
          <div className="w-full sm:w-64">
            <SelectField
              label={t("support.filter.kind")}
              value={kind ?? ""}
              onChange={(e) => go({ kind: e.target.value || null })}
            >
              <option value="">{t("support.filter.all")}</option>
              {KINDS.map((value) => (
                <option key={value} value={value}>
                  {t(KIND_LABELS[value])}
                </option>
              ))}
            </SelectField>
          </div>
        )}
      </div>

      {cases.isPending ? (
        <Loading />
      ) : cases.isError ? (
        // e.g. 403 "Only organizers and platform admins…": a translated message, no crash.
        <ErrorState error={cases.error} onRetry={() => cases.refetch()} />
      ) : cases.data.items.length === 0 ? (
        <EmptyState>{t(status || kind ? "support.inbox.emptyFiltered" : "support.inbox.empty")}</EmptyState>
      ) : (
        <>
          <ul
            aria-busy={cases.isPlaceholderData}
            className={`flex flex-col gap-2 transition-opacity ${
              cases.isPlaceholderData ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {cases.data.items.map((item) => (
              <InboxRow key={item.id} item={item} userId={user.id} showKind={isAdmin} />
            ))}
          </ul>
          <Pager page={page} pages={pages} busy={cases.isPlaceholderData} onPage={(p) => go({ page: p })} />
        </>
      )}
    </section>
  );
}
