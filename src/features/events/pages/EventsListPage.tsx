import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { FormField, SelectField } from "@/components/ui/FormField";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { dayEndIso, dayStartIso } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { pageCount, parsePage } from "@/lib/pagination";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { EVENTS_PAGE_SIZE, useEvents, useVenues } from "../api";
import { CATEGORIES, categoryLabelKey } from "../categories";
import { setCity, useCity } from "../city";
import { DateChips } from "../components/DateChips";
import { EventCard } from "../components/EventCard";
import { EventCardSkeleton } from "../components/EventCardSkeleton";
import type { DayRange } from "../dateRanges";

// Filters live in the URL (?q=&category=&from=&to=&page=), so a search can be shared and
// the back button works. The city comes from the header (saved in localStorage).
export function EventsListPage() {
  const { t } = useI18n();
  useDocumentTitle(t("events.title"));
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const page = parsePage(params.get("page"));
  const city = useCity();
  // Phone: category and dates fold under "Фильтры (N)" so the first card shows without scrolling.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [category, from, to].filter(Boolean).length;

  const events = useEvents({
    q,
    category,
    city,
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

  function setDates(range: DayRange | null) {
    const copy = new URLSearchParams(params);
    copy.delete("page");
    if (range) {
      copy.set("from", range.from);
      copy.set("to", range.to);
    } else {
      copy.delete("from");
      copy.delete("to");
    }
    setParams(copy);
  }

  function goToPage(next: number) {
    const copy = new URLSearchParams(params);
    if (next > 1) copy.set("page", String(next));
    else copy.delete("page");
    setParams(copy);
    window.scrollTo({ top: 0 });
  }

  const total = events.data?.total ?? 0;
  const pages = pageCount(total, EVENTS_PAGE_SIZE);

  // A page past the end (?page=999, or the list shrank) moves to the last page.
  const loaded = events.isSuccess && !events.isPlaceholderData;
  useEffect(() => {
    if (!loaded || page <= pages) return;
    const copy = new URLSearchParams(params);
    if (pages > 1) copy.set("page", String(pages));
    else copy.delete("page");
    setParams(copy, { replace: true });
  }, [loaded, page, pages, params, setParams]);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("events.title")}</h1>

      {/* key: the uncontrolled inputs reset when the URL changes (e.g. "Сбросить") */}
      <form
        key={params.toString()}
        onSubmit={onSubmit}
        role="search"
        className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <FormField
          label={t("events.search")}
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t("events.searchPlaceholder")}
        />
        <button
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
          className="justify-self-start text-sm font-medium underline sm:hidden"
        >
          {t("events.filters")}
          {activeFilters > 0 ? ` (${activeFilters})` : ""}
        </button>
        <div className={`${filtersOpen ? "grid gap-3" : "hidden"} sm:contents`}>
          <SelectField label={t("events.category")} name="category" defaultValue={category}>
            <option value="">{t("events.allCategories")}</option>
            {CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {t(categoryLabelKey(key))}
              </option>
            ))}
            {/* A category from an old link that is not in the list stays selectable. */}
            {category && !(CATEGORIES as readonly string[]).includes(category) && (
              <option value={category}>{category}</option>
            )}
          </SelectField>
          <FormField label={t("events.from")} name="from" type="date" defaultValue={from} />
          <FormField label={t("events.to")} name="to" type="date" defaultValue={to} />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit">{t("events.apply")}</Button>
          {[...params.keys()].length > 0 && (
            <Button type="button" variant="ghost" onClick={() => setParams({})}>
              {t("events.reset")}
            </Button>
          )}
        </div>
      </form>

      <DateChips from={from} to={to} onChange={setDates} />

      {events.isPending ? (
        <>
          <p role="status" className="sr-only">
            {t("common.loading")}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </ul>
        </>
      ) : events.isError ? (
        <ErrorState error={events.error} onRetry={() => events.refetch()} />
      ) : events.data.items.length === 0 ? (
        <EmptyState>
          <p>{city ? `${t("events.empty")} (${city})` : t("events.empty")}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[...params.keys()].length > 0 && (
              <Button variant="secondary" onClick={() => setParams({})}>
                {t("events.reset")}
              </Button>
            )}
            {city && (
              <Button variant="secondary" onClick={() => setCity("")}>
                {t("city.all")}
              </Button>
            )}
          </div>
        </EmptyState>
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
