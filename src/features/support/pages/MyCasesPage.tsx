import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { SelectField } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import type { CaseOut } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { pageCount, parsePage } from "@/lib/pagination";

import { SUPPORT_PAGE_SIZE, useMyCases } from "../api";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { CATEGORY_LABELS, isSupportStatus, statusLabel, STATUSES } from "../labels";

function CaseRow({ item }: { item: CaseOut }) {
  const { t, lang } = useI18n();
  return (
    <li>
      <Link
        to={`/support/cases/${item.id}`}
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-300 p-4 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CaseStatusBadge status={item.status} />
            <span className="font-semibold">{t(CATEGORY_LABELS[item.category])}</span>
          </div>
          <p className="truncate text-sm text-gray-700">
            {item.event_title ?? t("support.case.platform")}
          </p>
        </div>
        <time dateTime={item.created_at} className="text-sm text-gray-600">
          {formatDateTime(item.created_at, lang)}
        </time>
      </Link>
    </li>
  );
}

/** /support: cases I opened, newest first (?status=…&page=N). */
export function MyCasesPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get("status");
  const status = isSupportStatus(rawStatus) ? rawStatus : null;
  const page = parsePage(params.get("page"));
  const cases = useMyCases(status, page);
  const pages = pageCount(cases.data?.total ?? 0, SUPPORT_PAGE_SIZE);

  const go = (next: { status?: string | null; page?: number }) => {
    const s = next.status !== undefined ? next.status : status;
    const p = next.page ?? 1;
    setParams({ ...(s && { status: s }), ...(p > 1 && { page: String(p) }) });
  };

  // A page past the end (?page=999, or cases moved to another status) goes to the last page.
  const loaded = cases.isSuccess && !cases.isPlaceholderData;
  useEffect(() => {
    if (!loaded || page <= pages) return;
    setParams({ ...(status && { status }), ...(pages > 1 && { page: String(pages) }) }, { replace: true });
  }, [loaded, page, pages, status, setParams]);

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("support.my.title")}</h1>

      <div className="max-w-xs">
        <SelectField
          label={t("support.filter.status")}
          value={status ?? ""}
          onChange={(e) => go({ status: e.target.value || null })}
        >
          <option value="">{t("support.filter.all")}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(statusLabel(value, false))}
            </option>
          ))}
        </SelectField>
      </div>

      {cases.isPending ? (
        <Loading />
      ) : cases.isError ? (
        <ErrorState error={cases.error} onRetry={() => cases.refetch()} />
      ) : cases.data.items.length === 0 ? (
        <EmptyState>{t(status ? "support.my.emptyFiltered" : "support.my.empty")}</EmptyState>
      ) : (
        <>
          <ul
            aria-busy={cases.isPlaceholderData}
            className={`flex flex-col gap-2 transition-opacity ${
              cases.isPlaceholderData ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {cases.data.items.map((item) => (
              <CaseRow key={item.id} item={item} />
            ))}
          </ul>
          <Pager page={page} pages={pages} busy={cases.isPlaceholderData} onPage={(p) => go({ page: p })} />
        </>
      )}
    </section>
  );
}
