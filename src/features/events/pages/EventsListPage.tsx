import { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { dayEndIso, dayStartIso } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { EVENTS_PAGE_SIZE, useEvents, useVenues } from "../api";
import { EventCard } from "../components/EventCard";

// Filters live in the URL (?q=&category=&from=&to=&page=), so a search can be shared and
// the back button works.
export function EventsListPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const events = useEvents({
    q,
    category,
    // Invalid days in the URL (?from=abc) are ignored, not sent.
    from_date: dayStartIso(from),
    to_date: dayEndIso(to),
    offset: (page - 1) * EVENTS_PAGE_SIZE,
  });
  const venues = useVenues();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["q", "category", "from", "to"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) next.set(key, value);
    }
    setParams(next);
  }

  function goToPage(next: number) {
    const copy = new URLSearchParams(params);
    if (next > 1) copy.set("page", String(next));
    else copy.delete("page");
    setParams(copy);
    window.scrollTo({ top: 0 });
  }

  const total = events.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / EVENTS_PAGE_SIZE));

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("events.title")}</h1>

      {/* key: the uncontrolled inputs reset when the URL changes (e.g. "Сбросить") */}
      <form
        key={params.toString()}
        onSubmit={onSubmit}
        role="search"
        className="grid gap-3 rounded-lg border border-gray-300 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <FormField
          label={t("events.search")}
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t("events.searchPlaceholder")}
        />
        <FormField label={t("events.category")} name="category" defaultValue={category} />
        <FormField label={t("events.from")} name="from" type="date" defaultValue={from} />
        <FormField label={t("events.to")} name="to" type="date" defaultValue={to} />
        <div className="flex items-end gap-2">
          <Button type="submit">{t("events.apply")}</Button>
          {[...params.keys()].length > 0 && (
            <Button type="button" variant="ghost" onClick={() => setParams({})}>
              {t("events.reset")}
            </Button>
          )}
        </div>
      </form>

      {events.isPending ? (
        <Loading />
      ) : events.isError ? (
        <ErrorState error={events.error} onRetry={() => events.refetch()} />
      ) : events.data.items.length === 0 ? (
        <EmptyState>{t("events.empty")}</EmptyState>
      ) : (
        <>
          <p className="text-sm text-gray-700" aria-live="polite">
            {events.isPlaceholderData ? t("common.loading") : `${t("events.found")}: ${total}`}
          </p>
          {/* While the next page loads, the previous results stay but are dimmed and marked busy. */}
          <ul
            aria-busy={events.isPlaceholderData}
            className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
              events.isPlaceholderData ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {events.data.items.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                venue={venues.data?.find((venue) => venue.id === event.venue_id)}
              />
            ))}
          </ul>
          {pages > 1 && (
            <nav aria-label={t("events.page")} className="flex items-center gap-3">
              <Button
                variant="secondary"
                disabled={page <= 1 || events.isPlaceholderData}
                onClick={() => goToPage(page - 1)}
              >
                {t("events.prev")}
              </Button>
              <span className="text-sm">
                {t("events.page")} {page} {t("events.of")} {pages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= pages || events.isPlaceholderData}
                onClick={() => goToPage(page + 1)}
              >
                {t("events.next")}
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
