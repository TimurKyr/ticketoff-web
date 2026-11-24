import { useEffect, useState } from "react";

import { FormField, SelectField } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { useAuth } from "@/features/auth";
import type { TimelineItemOut } from "@/lib/api/types";
import { dayEndIso, dayStartIso, formatDateTime, formatKzt, formatPercent } from "@/lib/format";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { pageCount } from "@/lib/pagination";

import { TIMELINE_PAGE_SIZE, useTimelinePage, type TimelineFilters } from "../api";
import { shortOrderId } from "../orders/orderNumber";
import { ACTION_GROUPS, ACTION_LABELS } from "./actions";

const MONEY_KEYS = ["amount_kzt", "refunded_kzt"];
// Shown as the value alone: the action line already says what it is (a campaign's name).
const PLAIN_KEYS = ["name", "email"];
// "Ключ: значение" with a translated key (FE-22 #15: raw "discount_type: percent" before).
const KEY_LABELS: Record<string, MessageKey> = {
  code: "history.key.code",
  cancelled_orders: "history.key.cancelled_orders",
  refunded_orders: "history.key.refunded_orders",
  pending_cancelled: "history.key.pending_cancelled",
  ticket_count: "history.key.ticket_count",
  tickets: "history.key.ticket_count",
  method: "history.key.method",
};
// Ids say nothing to a person; the entity line already names the order.
const HIDDEN_KEY = /(^|_)ids?$/;

function Details({ details }: { details: Record<string, unknown> }) {
  const { t, lang } = useI18n();
  const parts: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined || value === "" || HIDDEN_KEY.test(key)) continue;
    if (key === "is_simulated" || key === "new" || key === "discount_type") continue;
    if (key === "discount_value" && typeof value === "number") {
      // A campaign: "−10 %" or "−1 000 ₸".
      parts.push(
        details.discount_type === "percent" ? `−${formatPercent(value, lang)}` : `−${formatKzt(value, lang)}`
      );
    } else if (PLAIN_KEYS.includes(key) && typeof value !== "object") {
      parts.push(String(value));
    } else if (KEY_LABELS[key] && typeof value !== "object") {
      parts.push(`${t(KEY_LABELS[key])}: ${String(value)}`);
    } else if (key === "old") {
      parts.push(`${String(value)} → ${String(details.new)}`);
    } else if (MONEY_KEYS.includes(key) && typeof value === "number") {
      parts.push(formatKzt(value, lang));
    } else if (key === "by") {
      parts.push(t(value === "buyer" ? "history.by.buyer" : "history.by.organizer"));
    } else if (key === "reason") {
      parts.push(`${t("history.reason")}: ${String(value)}`);
    } else if (typeof value !== "object") {
      parts.push(`${key}: ${String(value)}`);
    }
  }
  return parts.length ? <p className="break-words text-sm text-gray-700">{parts.join(" · ")}</p> : null;
}

function TimelineRow({ item, tz, viewerId }: { item: TimelineItemOut; tz: string; viewerId: string }) {
  const { t, lang } = useI18n();
  const label: MessageKey | undefined = ACTION_LABELS[item.action_type];
  const actor =
    item.actor_user_id === null
      ? t("history.actor.system")
      : item.actor_user_id === viewerId
        ? t("history.actor.you")
        : t("history.actor.other");
  return (
    <li className="flex flex-col gap-1 border-b border-gray-200 py-3 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-medium">
          {label ? t(label) : <span className="font-mono text-sm">{item.action_type}</span>}
          {item.entity_type === "order" && item.entity_id && (
            <span className="ml-2 text-sm text-gray-700">
              {t("common.numberSign")}<span className="font-mono">{shortOrderId(item.entity_id)}</span>
            </span>
          )}
        </span>
        <time dateTime={item.created_at} className="text-xs text-gray-600">
          {formatDateTime(item.created_at, lang, tz)}
        </time>
      </div>
      <p className="text-xs text-gray-600">
        {t("history.actor")}: {actor}
      </p>
      {item.details && <Details details={item.details as Record<string, unknown>} />}
    </li>
  );
}

const EMPTY: TimelineFilters = { from_date: "", to_date: "", action_type: "" };

/** «История» (R-107): the event's audit log, newest first, filtered by the API. */
export function HistoryTab({ eventId, tz }: { eventId: string; tz: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [actionType, setActionType] = useState("");
  const [page, setPage] = useState(1);
  // Days are the event's local days: [start of "from", end of "to"] in the venue's zone.
  const filters: TimelineFilters = {
    ...EMPTY,
    from_date: (fromDay && dayStartIso(fromDay, tz)) || "",
    to_date: (toDay && dayEndIso(toDay, tz)) || "",
    action_type: actionType,
  };
  const { count, rows, total } = useTimelinePage(eventId, filters, page);
  const pages = pageCount(total, TIMELINE_PAGE_SIZE);
  useEffect(() => setPage(1), [fromDay, toDay, actionType]);

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-4">
      <h2 id="history-title" className="text-lg font-semibold">
        {t("history.title")}
        {count.data && <span className="ml-2 text-sm font-normal text-gray-600">({total})</span>}
      </h2>
      {/* min-w-0: a date input is wider than a phone column by default (Chrome). */}
      <div className="grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        <FormField label={t("history.from")} type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
        <FormField label={t("history.to")} type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
        <SelectField label={t("history.action")} value={actionType} onChange={(e) => setActionType(e.target.value)}>
          <option value="">{t("history.allActions")}</option>
          {ACTION_GROUPS.map((group) => (
            <optgroup key={group.prefix} label={t(group.label)}>
              <option value={group.prefix}>
                {t(group.label)}: {t("history.allOfGroup")}
              </option>
              {Object.entries(ACTION_LABELS)
                .filter(([type]) => type.startsWith(group.prefix))
                .map(([type, key]) => (
                  <option key={type} value={type}>
                    {t(key)}
                  </option>
                ))}
            </optgroup>
          ))}
        </SelectField>
      </div>
      <p className="text-xs text-gray-600">{t("history.newestFirst")}</p>

      {count.isPending || (rows.isPending && total > 0) ? (
        <Loading />
      ) : count.isError || rows.isError ? (
        <ErrorState error={count.error ?? rows.error} onRetry={() => (count.isError ? count.refetch() : rows.refetch())} />
      ) : total === 0 || !rows.data ? (
        <EmptyState>{t(fromDay || toDay || actionType ? "history.emptyFiltered" : "history.empty")}</EmptyState>
      ) : (
        <>
          <ul>
            {rows.data.items.map((item) => (
              <TimelineRow key={item.id} item={item} tz={tz} viewerId={user?.id ?? ""} />
            ))}
          </ul>
          <Pager page={page} pages={pages} busy={rows.isFetching} onPage={setPage} />
        </>
      )}
    </section>
  );
}
