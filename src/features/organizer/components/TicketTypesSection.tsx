import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField, SelectField } from "@/components/ui/FormField";
import { ErrorState, Loading } from "@/components/ui/States";
import { errorMessage } from "@/lib/api/errors";
import type { TicketKind, TicketTypeCreate, TicketTypeOut } from "@/lib/api/types";
import { formatKzt, isoToLocalInput, localInputToIso } from "@/lib/format";
import { isWholeInRange, MAX_PRICE_KZT, MAX_QUANTITY, useSyncedValues } from "@/lib/forms";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { useCreateTicketType, useTicketTypes, useUpdateTicketType } from "../api";

interface Values {
  name: string;
  description: string;
  kind: TicketKind;
  price_kzt: string;
  quantity_total: string;
  max_per_order: string;
  sales_start_at: string;
  sales_end_at: string;
  is_hidden: boolean;
}

function toValues(type: TicketTypeOut | undefined, tz: string): Values {
  return {
    name: type?.name ?? "",
    description: type?.description ?? "",
    kind: type?.kind ?? "free",
    price_kzt: type ? String(type.price_kzt) : "0",
    quantity_total: type ? String(type.quantity_total) : "",
    max_per_order: type?.max_per_order != null ? String(type.max_per_order) : "",
    sales_start_at: isoToLocalInput(type?.sales_start_at, tz),
    sales_end_at: isoToLocalInput(type?.sales_end_at, tz),
    is_hidden: type?.is_hidden ?? false,
  };
}

// The API's default when max_per_order is omitted; an explicit null would mean "no limit".
const DEFAULT_MAX_PER_ORDER = 10;

function toPayload(v: Values, tz: string): TicketTypeCreate {
  const quantity = Number(v.quantity_total);
  return {
    name: v.name.trim(),
    description: v.description.trim() || null,
    kind: v.kind,
    price_kzt: v.kind === "free" ? 0 : Number(v.price_kzt),
    quantity_total: quantity,
    // Empty means the API default (never "unlimited"), also when editing.
    max_per_order: v.max_per_order.trim()
      ? Number(v.max_per_order)
      : Math.min(DEFAULT_MAX_PER_ORDER, quantity),
    sales_start_at: localInputToIso(v.sales_start_at, tz),
    sales_end_at: localInputToIso(v.sales_end_at, tz),
    is_hidden: v.is_hidden,
  };
}

/** Same rules as the API (ticket_type_rule_error), checked before sending. */
function validate(v: Values): MessageKey | null {
  if (!v.name.trim() || !isWholeInRange(v.quantity_total, 1, MAX_QUANTITY)) return "org.tt.invalid";
  if (v.kind === "paid" && !isWholeInRange(v.price_kzt, 1, MAX_PRICE_KZT)) return "org.tt.invalid";
  if (v.max_per_order.trim() && !isWholeInRange(v.max_per_order, 1, Number(v.quantity_total)))
    return "org.tt.maxInvalid";
  // Same zone for both fields, so the wall-clock strings compare correctly.
  if (v.sales_start_at && v.sales_end_at && v.sales_end_at <= v.sales_start_at) return "org.tt.salesOrder";
  return null;
}

function TicketTypeForm({
  eventId,
  type,
  tz,
  onDone,
}: {
  eventId: string;
  type?: TicketTypeOut;
  tz: string;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const create = useCreateTicketType(eventId);
  const update = useUpdateTicketType(eventId);
  // Untouched fields follow the latest ticket type from the server while the form is open.
  const [values, setValues] = useSyncedValues<Values>(toValues(type, tz));
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Values>) => setValues((prev) => ({ ...prev, ...patch }));
  const busy = create.isPending || update.isPending;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const invalid = validate(values);
    if (invalid) return setError(t(invalid));
    const payload = toPayload(values, tz);
    try {
      if (type) {
        const before = toPayload(toValues(type, tz), tz);
        const changes = Object.fromEntries(
          Object.entries(payload).filter(
            ([key, value]) => value !== before[key as keyof TicketTypeCreate]
          )
        );
        if (Object.keys(changes).length) await update.mutateAsync({ id: type.id, payload: changes });
      } else {
        await create.mutateAsync(payload);
      }
      onDone();
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-md bg-gray-50 p-4">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t("org.tt.name")} required value={values.name} onChange={(e) => set({ name: e.target.value })} />
        <SelectField
          label={t("org.tt.kind")}
          value={values.kind}
          onChange={(e) => set({ kind: e.target.value as TicketKind })}
        >
          <option value="free">{t("org.tt.kind.free")}</option>
          <option value="paid">{t("org.tt.kind.paid")}</option>
        </SelectField>
        {values.kind === "paid" && (
          <FormField
            label={t("org.tt.price")}
            type="number"
            min={1}
            inputMode="numeric"
            required
            value={values.price_kzt}
            onChange={(e) => set({ price_kzt: e.target.value })}
          />
        )}
        <FormField
          label={t("org.tt.quantity")}
          type="number"
          min={1}
          inputMode="numeric"
          required
          value={values.quantity_total}
          onChange={(e) => set({ quantity_total: e.target.value })}
        />
        <FormField
          label={t("org.tt.maxPerOrder")}
          hint={t("org.tt.maxPerOrderHint")}
          type="number"
          min={1}
          inputMode="numeric"
          value={values.max_per_order}
          onChange={(e) => set({ max_per_order: e.target.value })}
        />
        <FormField
          label={t("org.tt.description")}
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
        />
        <FormField
          label={t("org.tt.salesStart")}
          type="datetime-local"
          value={values.sales_start_at}
          onChange={(e) => set({ sales_start_at: e.target.value })}
        />
        <FormField
          label={t("org.tt.salesEnd")}
          type="datetime-local"
          value={values.sales_end_at}
          onChange={(e) => set({ sales_end_at: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.is_hidden}
          onChange={(e) => set({ is_hidden: e.target.checked })}
        />
        {t("org.tt.isHidden")}
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? t("common.loading") : t("org.tt.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("org.tt.cancel")}
        </Button>
      </div>
    </form>
  );
}

export function TicketTypesSection({
  eventId,
  tz,
  editable,
}: {
  eventId: string;
  tz: string;
  /** False for cancelled/completed events. */
  editable: boolean;
}) {
  const { t, lang } = useI18n();
  const types = useTicketTypes(eventId);
  const update = useUpdateTicketType(eventId);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleHidden(type: TicketTypeOut) {
    setError(null);
    try {
      await update.mutateAsync({ id: type.id, payload: { is_hidden: !type.is_hidden } });
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <h2 className="text-xl font-semibold">{t("org.tt.title")}</h2>
      {error && <Alert tone="error">{error}</Alert>}
      {types.isPending ? (
        <Loading />
      ) : types.isError ? (
        <ErrorState error={types.error} onRetry={() => types.refetch()} />
      ) : (
        <>
          {types.data.length === 0 && <p className="text-gray-700">{t("org.tt.empty")}</p>}
          <ul className="flex flex-col gap-2">
            {types.data.map((type) =>
              editing === type.id ? (
                <li key={type.id}>
                  <TicketTypeForm eventId={eventId} type={type} tz={tz} onDone={() => setEditing(null)} />
                </li>
              ) : (
                <li
                  key={type.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 py-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {type.name}
                      {type.is_hidden && (
                        <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs">{t("org.tt.hidden")}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-700">
                      {type.kind === "free" ? t("events.free") : formatKzt(type.price_kzt, lang)} ·{" "}
                      {t("org.tt.sold")}: {type.sold} / {type.quantity_total} · {t("org.tt.available")}:{" "}
                      {type.available}
                    </p>
                  </div>
                  {editable && (
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setEditing(type.id)}>
                        {t("org.tt.edit")}
                      </Button>
                      <Button variant="ghost" onClick={() => toggleHidden(type)} disabled={update.isPending}>
                        {type.is_hidden ? t("org.tt.show") : t("org.tt.hide")}
                      </Button>
                    </div>
                  )}
                </li>
              )
            )}
          </ul>
          {editable &&
            (editing === "new" ? (
              <TicketTypeForm eventId={eventId} tz={tz} onDone={() => setEditing(null)} />
            ) : (
              <Button variant="secondary" className="self-start" onClick={() => setEditing("new")}>
                + {t("org.tt.add")}
              </Button>
            ))}
        </>
      )}
    </section>
  );
}
