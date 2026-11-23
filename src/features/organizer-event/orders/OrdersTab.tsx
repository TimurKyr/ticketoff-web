import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { FormField, SelectField } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import type { OrderStatus } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";
import { pageCount, parsePage } from "@/lib/pagination";

import { ORDERS_PAGE_SIZE, useEventOrders } from "../api";
import { ReadOnlyNote } from "../components/Stats";
import { OrderCard } from "./OrderCard";
import { RevenueBlock } from "./RevenueBlock";

const STATUSES: OrderStatus[] = ["paid", "free_confirmed", "pending", "cancelled", "refunded"];
const isStatus = (value: string | null): value is OrderStatus =>
  (STATUSES as (string | null)[]).includes(value);
const SEARCH_DELAY_MS = 300;

/** «Участники и заказы»: search (?q), status (?status) and page (?page) live in the URL. */
export function OrdersTab({ eventId, tz, readOnly }: { eventId: string; tz: string; readOnly: boolean }) {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const rawStatus = params.get("status");
  const status = isStatus(rawStatus) ? rawStatus : null;
  const page = parsePage(params.get("page"));
  const [typed, setTyped] = useState(q);
  const orders = useEventOrders(eventId, q.trim(), status, page);
  const pages = pageCount(orders.data?.total ?? 0, ORDERS_PAGE_SIZE);

  /** Change some params, keep the rest (the tab above all); a new search starts at page 1. */
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

  // Typing updates the URL once the user pauses; Back/forward or a pasted link set the box.
  useEffect(() => {
    if (typed === q) return;
    const timer = window.setTimeout(() => update({ q: typed.trim() ? typed : null, page: null }, true), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
    // `update` only wraps setParams; listing it would restart the timer on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);
  useEffect(() => setTyped(q), [q]);

  // A page past the end (?page=99, or orders moved to another status) goes to the last page.
  const loaded = orders.isSuccess && !orders.isPlaceholderData;
  useEffect(() => {
    if (loaded && page > pages) update({ page: pages > 1 ? String(pages) : null }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, page, pages]);

  return (
    <div className="flex flex-col gap-5">
      <RevenueBlock eventId={eventId} />

      <section aria-labelledby="orders-title" className="flex flex-col gap-4">
        <h2 id="orders-title" className="text-lg font-semibold">
          {t("orgEvent.orders.title")}
          {orders.data && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({t("orgEvent.orders.found")}: {orders.data.total})
            </span>
          )}
        </h2>
        {readOnly && <ReadOnlyNote />}

        <div className="grid gap-3 sm:grid-cols-[1fr_14rem] [&>*]:min-w-0">
          <FormField
            label={t("orgEvent.orders.search")}
            hint={t("orgEvent.orders.searchHint")}
            type="search"
            value={typed}
            maxLength={100}
            onChange={(e) => setTyped(e.target.value)}
          />
          <SelectField
            label={t("orgEvent.orders.status")}
            value={status ?? ""}
            onChange={(e) => update({ status: e.target.value || null, page: null })}
          >
            <option value="">{t("orgEvent.orders.allStatuses")}</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`order.status.${value}`)}
              </option>
            ))}
          </SelectField>
        </div>

        {orders.isPending ? (
          <Loading />
        ) : orders.isError ? (
          <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
        ) : orders.data.items.length === 0 ? (
          <EmptyState>{t(q || status ? "orgEvent.orders.emptyFiltered" : "orgEvent.orders.empty")}</EmptyState>
        ) : (
          <>
            <ul
              aria-busy={orders.isPlaceholderData}
              className={`flex flex-col gap-3 transition-opacity ${
                orders.isPlaceholderData ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {orders.data.items.map((order) => (
                <OrderCard key={order.id} eventId={eventId} order={order} tz={tz} readOnly={readOnly} />
              ))}
            </ul>
            <Pager
              page={page}
              pages={pages}
              busy={orders.isPlaceholderData}
              onPage={(p) => update({ page: p > 1 ? String(p) : null })}
            />
          </>
        )}
      </section>
    </div>
  );
}
