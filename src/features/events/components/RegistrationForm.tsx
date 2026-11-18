import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/features/auth";
import { errorMessage } from "@/lib/api/errors";
import type { AttendeeIn, PublicTicketTypeOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { registerFree } from "../api";

const MAX_PER_TYPE = 10;

/** Most tickets of this type one order may take right now. */
function maxFor(type: PublicTicketTypeOut): number {
  return Math.max(0, Math.min(type.max_per_order ?? MAX_PER_TYPE, type.available, MAX_PER_TYPE));
}

interface Props {
  eventId: string;
  /** Free ticket types that can be taken now (available > 0). */
  ticketTypes: PublicTicketTypeOut[];
}

/** Free registration: pick quantities, give a name per ticket, get the order with tickets. */
export function RegistrationForm({ eventId, ticketTypes }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Record<string, number>>(() =>
    ticketTypes.length === 1 ? { [ticketTypes[0].id]: 1 } : {}
  );
  // Attendees are kept per ticket type, so changing one type's quantity never moves
  // someone's name onto a ticket of another type.
  const [attendees, setAttendees] = useState<Record<string, AttendeeIn[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname + location.search }}
        className="inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        {t("register.loginFirst")}
      </Link>
    );
  }

  // Availability is refetched after other people register: never ask for more than is left.
  const quantity = (type: PublicTicketTypeOut) => Math.min(selected[type.id] ?? 0, maxFor(type));
  const chosen = ticketTypes.filter((type) => quantity(type) > 0);
  const totalTickets = chosen.reduce((sum, type) => sum + quantity(type), 0);

  // One row per ticket, grouped by type in the same order as `items` (the API matches
  // attendees to tickets in item order). The first row defaults to the user's email.
  let first = true;
  const groups = chosen.map((type) => ({
    type,
    rows: Array.from({ length: quantity(type) }, (_, i): AttendeeIn => {
      const saved = attendees[type.id]?.[i];
      const row = {
        name: saved?.name ?? "",
        email: saved?.email ?? (first ? user.email : ""),
      };
      first = false;
      return row;
    }),
  }));
  const rows = groups.flatMap((group) => group.rows);

  function setRow(typeId: string, index: number, patch: Partial<AttendeeIn>) {
    const current = groups.find((group) => group.type.id === typeId)?.rows ?? [];
    setAttendees((prev) => {
      const next = [...(prev[typeId] ?? [])];
      next[index] = { ...current[index], ...patch };
      return { ...prev, [typeId]: next };
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (totalTickets === 0) return setError(t("register.pickTickets"));
    if (rows.some((row) => !row.name.trim())) return setError(t("register.nameRequired"));

    setSubmitting(true);
    try {
      const order = await registerFree(eventId, {
        items: chosen.map((type) => ({ ticket_type_id: type.id, quantity: quantity(type) })),
        attendees: rows.map((row) => ({
          name: row.name.trim(),
          email: row.email?.trim() || null,
        })),
      });
      await queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", eventId] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate(`/orders/${order.id}`, { state: { justRegistered: true } });
    } catch (err) {
      setError(errorMessage(err, t));
      setSubmitting(false);
      // Stock may have changed under us (e.g. "Not enough tickets left").
      void queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", eventId] });
    }
  }

  let rowNumber = 0;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("register.title")}</h2>
      {error && <Alert tone="error">{error}</Alert>}

      {ticketTypes.map((type) => (
        <div key={type.id} className="flex items-center justify-between gap-3 text-sm">
          <label htmlFor={`qty-${type.id}`}>
            {type.name} · {t("events.quantity")}
          </label>
          <select
            id={`qty-${type.id}`}
            value={quantity(type)}
            onChange={(e) => setSelected({ ...selected, [type.id]: Number(e.target.value) })}
            className="rounded border border-gray-400 bg-white px-2 py-1"
          >
            {Array.from({ length: maxFor(type) + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      ))}

      {rows.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-medium">{t("register.attendees")}</legend>
          <p className="text-xs text-gray-600">{t("register.attendeesHint")}</p>
          {groups.map(({ type, rows: typeRows }) =>
            typeRows.map((row, i) => {
              rowNumber += 1;
              return (
                <div key={`${type.id}-${i}`} className="grid gap-2 rounded-md bg-gray-50 p-3 sm:grid-cols-2">
                  <FormField
                    label={`${t("register.attendee")} ${rowNumber} (${type.name}): ${t("register.name")}`}
                    autoComplete={rowNumber === 1 ? "name" : "off"}
                    required
                    value={row.name}
                    onChange={(e) => setRow(type.id, i, { name: e.target.value })}
                  />
                  <FormField
                    label={t("register.email")}
                    type="email"
                    autoComplete={rowNumber === 1 ? "email" : "off"}
                    value={row.email ?? ""}
                    onChange={(e) => setRow(type.id, i, { email: e.target.value })}
                  />
                </div>
              );
            })
          )}
        </fieldset>
      )}

      <Button type="submit" disabled={submitting || totalTickets === 0} className="self-start">
        {submitting ? t("common.loading") : t("register.submit")}
      </Button>
    </form>
  );
}
