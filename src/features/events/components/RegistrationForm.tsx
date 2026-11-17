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

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    ticketTypes.length === 1 ? { [ticketTypes[0].id]: 1 } : {}
  );
  const [attendees, setAttendees] = useState<AttendeeIn[]>([]);
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

  // One attendee row per ticket, in ticket type order (the API matches them the same way).
  const totalTickets = ticketTypes.reduce((sum, type) => sum + (quantities[type.id] ?? 0), 0);
  const rows: AttendeeIn[] = Array.from({ length: totalTickets }, (_, i) => ({
    name: attendees[i]?.name ?? "",
    email: attendees[i]?.email ?? (i === 0 ? user.email : ""),
  }));

  function setRow(index: number, patch: Partial<AttendeeIn>) {
    setAttendees(() => {
      const next = [...rows];
      next[index] = { ...next[index], ...patch };
      return next;
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
        items: ticketTypes
          .filter((type) => (quantities[type.id] ?? 0) > 0)
          .map((type) => ({ ticket_type_id: type.id, quantity: quantities[type.id] })),
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
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("register.title")}</h2>
      {error && <Alert tone="error">{error}</Alert>}

      {ticketTypes.map((type) => {
        const max = Math.min(type.max_per_order ?? MAX_PER_TYPE, type.available, MAX_PER_TYPE);
        return (
          <div key={type.id} className="flex items-center justify-between gap-3 text-sm">
            <label htmlFor={`qty-${type.id}`}>
              {type.name} · {t("events.quantity")}
            </label>
            <select
              id={`qty-${type.id}`}
              value={quantities[type.id] ?? 0}
              onChange={(e) =>
                setQuantities({ ...quantities, [type.id]: Number(e.target.value) })
              }
              className="rounded border border-gray-400 bg-white px-2 py-1"
            >
              {Array.from({ length: max + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      {rows.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-medium">{t("register.attendees")}</legend>
          <p className="text-xs text-gray-600">{t("register.attendeesHint")}</p>
          {rows.map((row, i) => (
            <div key={i} className="grid gap-2 rounded-md bg-gray-50 p-3 sm:grid-cols-2">
              <FormField
                label={`${t("register.attendee")} ${i + 1}: ${t("register.name")}`}
                autoComplete={i === 0 ? "name" : "off"}
                required
                value={row.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
              />
              <FormField
                label={t("register.email")}
                type="email"
                autoComplete={i === 0 ? "email" : "off"}
                value={row.email ?? ""}
                onChange={(e) => setRow(i, { email: e.target.value })}
              />
            </div>
          ))}
        </fieldset>
      )}

      <Button type="submit" disabled={submitting || totalTickets === 0} className="self-start">
        {submitting ? t("common.loading") : t("register.submit")}
      </Button>
    </form>
  );
}
