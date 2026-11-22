import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { SelectField } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import type { EventBucket } from "@/lib/api/types";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { pageCount, parsePage } from "@/lib/pagination";

import { HISTORY_PAGE_SIZE, useEventHistory } from "../api";
import { Percent, SimulationBadge } from "../components/Stats";

const BUCKETS: EventBucket[] = ["upcoming", "active", "completed", "cancelled"];
const isBucket = (v: string | null): v is EventBucket => (BUCKETS as (string | null)[]).includes(v);

/**
 * «История событий»: every event with its numbers (GET /organizer/analytics/events), each
 * linking to its «Аналитика» tab. ?hbucket / ?hpage, so the dashboard's ?tab / ?page stay.
 */
export function EventHistoryList() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const raw = params.get("hbucket");
  const bucket = isBucket(raw) ? raw : null;
  const page = parsePage(params.get("hpage"));
  const history = useEventHistory(bucket, page);
  const pages = pageCount(history.data?.total ?? 0, HISTORY_PAGE_SIZE);

  function update(patch: Record<string, string | null>, replace = false) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace }
    );
  }

  const loaded = history.isSuccess && !history.isPlaceholderData;
  useEffect(() => {
    if (loaded && page > pages) update({ hpage: pages > 1 ? String(pages) : null }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, page, pages]);

  return (
    <section aria-labelledby="event-history-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="event-history-title" className="flex flex-wrap items-center gap-2 text-xl font-semibold">
          {t("dashboard.history")} <SimulationBadge />
        </h2>
        <div className="w-full sm:w-56">
          <SelectField
            label={t("dashboard.historyFilter")}
            value={bucket ?? ""}
            onChange={(e) => update({ hbucket: e.target.value || null, hpage: null })}
          >
            <option value="">{t("dashboard.allEvents")}</option>
            {BUCKETS.map((b) => (
              <option key={b} value={b}>
                {t(`org.bucket.${b}`)}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {history.isPending ? (
        <Loading />
      ) : history.isError ? (
        <ErrorState error={history.error} onRetry={() => history.refetch()} />
      ) : history.data.items.length === 0 ? (
        <EmptyState>{t("org.empty")}</EmptyState>
      ) : (
        <>
          <ul
            aria-busy={history.isPlaceholderData}
            className={`flex flex-col gap-2 transition-opacity ${history.isPlaceholderData ? "pointer-events-none opacity-50" : ""}`}
          >
            {history.data.items.map((e) => (
              <li key={e.event_id}>
                <Link
                  to={`/organizer/events/${e.event_id}?tab=analytics`}
                  className="flex flex-col gap-2 rounded-lg border border-gray-300 p-4 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{e.title}</span>
                    <time dateTime={e.start_at} className="text-xs text-gray-600">
                      {formatDateTime(e.start_at, lang)}
                    </time>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-gray-600">{t("orgEvent.analytics.sold")}</dt>
                      <dd className="tabular-nums">
                        {e.tickets_sold} / {e.tickets_total} (<Percent value={e.percent_sold} />)
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-600">{t("orgEvent.money.gross")}</dt>
                      <dd className="tabular-nums">{formatKzt(e.gross_kzt, lang)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-600">{t("orgEvent.money.payout")}</dt>
                      <dd className="tabular-nums">{formatKzt(e.estimated_payout_kzt, lang)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-600">{t("orgEvent.analytics.attendancePercent")}</dt>
                      <dd className="tabular-nums">
                        <Percent value={e.check_in_percent} />
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={page} pages={pages} busy={history.isPlaceholderData} onPage={(p) => update({ hpage: p > 1 ? String(p) : null })} />
        </>
      )}
    </section>
  );
}
