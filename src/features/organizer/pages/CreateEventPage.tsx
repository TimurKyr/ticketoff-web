import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { ErrorState, Loading } from "@/components/ui/States";
import { useVenues } from "@/features/events/api";
import type { EventCreate } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { createEvent } from "../api";
import { EventForm } from "../components/EventForm";

export function CreateEventPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const venues = useVenues();

  async function onSubmit(payload: Partial<EventCreate>) {
    const event = await createEvent(payload as EventCreate);
    await queryClient.invalidateQueries({ queryKey: ["organizer"] });
    navigate(`/organizer/events/${event.id}`, { state: { notice: "org.form.created" } });
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link to="/organizer" className="text-sm underline">
        ← {t("org.back")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("org.form.createTitle")}</h1>
      {venues.isPending ? (
        <Loading />
      ) : venues.isError ? (
        <ErrorState error={venues.error} onRetry={() => venues.refetch()} />
      ) : (
        <EventForm venues={venues.data} submitLabel={t("org.form.create")} onSubmit={onSubmit} />
      )}
    </section>
  );
}
