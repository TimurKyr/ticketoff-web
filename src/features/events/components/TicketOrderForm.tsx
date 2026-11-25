import { FormEvent, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useAuth, VerifyEmailNotice } from "@/features/auth";
import {
  OrderSummaryBox,
  orderSummary,
  PromoCodeField,
  RefundPolicy,
  startCheckout,
} from "@/features/checkout";
import { track } from "@/lib/analytics";
import { errorMessage, isEmailNotVerified } from "@/lib/api/errors";
import type { AttendeeIn, PublicTicketTypeOut, TicketKind } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { registerFree } from "../api";

const MAX_PER_TYPE = 10;

/** Most tickets of this type one order may take right now. */
function maxFor(type: PublicTicketTypeOut): number {
  return Math.max(0, Math.min(type.max_per_order ?? MAX_PER_TYPE, type.available, MAX_PER_TYPE));
}

interface Props {
  eventId: string;
  /** Free: registration, tickets at once. Paid: checkout, a pending order to pay. */
  kind: TicketKind;
  /** Ticket types of this kind that can be taken now (available > 0). */
  ticketTypes: PublicTicketTypeOut[];
  /** Paid only: shown before the buyer commits. */
  /** From the loaded event; shown before a paid checkout. */
  refundPolicy: string | null;
  /** Paid only: code from a campaign QR link, filled in unless the buyer typed one. */
  linkPromoCode?: string | null;
}

/**
 * Pick quantities and give a name per ticket. Free types are registered right away;
 * paid types start a checkout (tickets held for a while, then the simulated payment).
 */
export function TicketOrderForm({ eventId, kind, ticketTypes, refundPolicy, linkPromoCode }: Props) {
  const { t } = useI18n();
  const { user, refresh } = useAuth();
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
  const errorRef = useRef<HTMLDivElement>(null);
  // A new error is scrolled into view (a long list of attendees may push it below the fold).
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [error]);
  const [submitting, setSubmitting] = useState(false);
  const [promo, setPromo] = useState("");
  // The discount the promo check found for the current code and tickets (order summary).
  const [discount, setDiscount] = useState<number | null>(null);
  const paid = kind === "paid";
  // The server refused with EMAIL_NOT_VERIFIED although the cached /auth/me said confirmed.
  const [refusedUnverified, setRefusedUnverified] = useState(false);
  const emailVerified = user?.email_verified;
  useEffect(() => setRefusedUnverified(false), [emailVerified]);

  useEffect(() => {
    if (linkPromoCode) setPromo((typed) => typed || linkPromoCode);
  }, [linkPromoCode]);

  // When availability drops (others registered, a type sold out or left the list), the
  // stored quantity is lowered too, so it never jumps back up if stock returns later.
  // Names typed for tickets that no longer fit are dropped with them.
  const limits = ticketTypes.map((type) => `${type.id}:${maxFor(type)}`).join(",");
  useEffect(() => {
    const max = new Map(ticketTypes.map((type) => [type.id, maxFor(type)]));
    const clamp = (id: string, n: number) => Math.min(n, max.get(id) ?? 0);
    setSelected((prev) => {
      const over = Object.entries(prev).filter(([id, n]) => clamp(id, n) !== n);
      if (over.length === 0) return prev;
      const next = { ...prev };
      for (const [id, n] of over) next[id] = clamp(id, n);
      return next;
    });
    setAttendees((prev) => {
      const over = Object.entries(prev).filter(([id, rows]) => rows.length > clamp(id, rows.length));
      if (over.length === 0) return prev;
      const next = { ...prev };
      for (const [id, rows] of over) next[id] = rows.slice(0, clamp(id, rows.length));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `limits` captures what matters in ticketTypes
  }, [limits]);

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname + location.search }}
        className="inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        {paid ? t("checkout.loginFirst") : t("register.loginFirst")}
      </Link>
    );
  }

  // Also clamped here, for the one render before the effect above has run.
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
  const summary = orderSummary(
    chosen.map((type) => ({ id: type.id, name: type.name, quantity: quantity(type), price_kzt: type.price_kzt })),
    discount
  );

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
    setRefusedUnverified(false);
    if (totalTickets === 0) return setError(t("register.pickTickets"));
    if (rows.some((row) => !row.name.trim())) return setError(t("register.nameRequired"));

    setSubmitting(true);
    // Price before any promo discount; the server has the final amount.
    const listPrice = chosen.reduce((sum, type) => sum + type.price_kzt * quantity(type), 0);
    track("begin_checkout", { currency: "KZT", value: listPrice, quantity: totalTickets, ticket_kind: kind });
    try {
      const payload = {
        items: chosen.map((type) => ({ ticket_type_id: type.id, quantity: quantity(type) })),
        attendees: rows.map((row) => ({
          name: row.name.trim(),
          email: row.email?.trim() || null,
        })),
      };
      const order = paid
        ? await startCheckout(eventId, { ...payload, promo_code: promo.trim() || null })
        : await registerFree(eventId, payload);
      // A free registration is complete at once; a paid one counts when it is paid (OrderPage).
      if (!paid) track("purchase", { currency: "KZT", value: 0, quantity: totalTickets, ticket_kind: kind });
      await queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", eventId] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate(`/orders/${order.id}`, { state: { justCreated: true } });
    } catch (err) {
      setSubmitting(false);
      if (isEmailNotVerified(err)) {
        // Shown as the "confirm your email" box; /auth/me is re-read so the page agrees.
        setRefusedUnverified(true);
        void refresh();
        return;
      }
      setError(errorMessage(err, t));
      // Stock may have changed under us (e.g. "Not enough tickets left"), or the event itself
      // (cancelled, sales suspended: then the page shows that instead of this form).
      void queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", eventId] });
      void queryClient.invalidateQueries({ queryKey: ["events", "detail"] });
    }
  }

  let rowNumber = 0;
  // "(Партер)" tells tickets of several types apart; one type, or a type called «Участник»
  // itself, says nothing new (FE-22 #24: «Участник 1 (Участник)»).
  const typeNote = (name: string) =>
    ticketTypes.length > 1 && name.trim().toLowerCase() !== t("register.attendee").toLowerCase()
      ? ` (${name})`
      : "";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">{paid ? t("checkout.title") : t("register.title")}</h3>

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
                    label={`${t("register.attendee")} ${rowNumber}${typeNote(type.name)}: ${t("register.name")}`}
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

      {paid && (
        <>
          <PromoCodeField
            eventId={eventId}
            value={promo}
            onChange={setPromo}
            items={chosen.map((type) => ({ ticket_type_id: type.id, quantity: quantity(type) }))}
            onDiscountChange={setDiscount}
          />
          <OrderSummaryBox summary={summary} promoUnchecked={Boolean(promo.trim()) && discount == null} />
          <RefundPolicy policy={refundPolicy} />
          <p className="text-xs text-gray-600">{t("checkout.holdNote")}</p>
        </>
      )}

      {/* Right above the button, so the answer to a click is where the buyer is looking
          (FE-22 #1: it used to be at the top of a long form, out of view). */}
      {error && (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {refusedUnverified && <VerifyEmailNotice reason="buy" force />}

      {/* Early hint only: the server checks again and answers 403 EMAIL_NOT_VERIFIED. */}
      <Button
        type="submit"
        disabled={submitting || totalTickets === 0 || !user.email_verified}
        aria-describedby={user.email_verified ? undefined : `verify-hint-${kind}`}
        className="self-start"
      >
        {submitting ? t("common.loading") : paid ? t("checkout.submit") : t("register.submit")}
      </Button>
      {!user.email_verified && (
        <p id={`verify-hint-${kind}`} className="text-sm text-amber-900">
          {t(paid ? "verifyEmail.hint.buy" : "verifyEmail.hint.register")}
        </p>
      )}
    </form>
  );
}
