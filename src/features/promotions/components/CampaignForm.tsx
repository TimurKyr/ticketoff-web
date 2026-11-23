import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField, SelectField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import type { CampaignCreate, CampaignOut, DiscountType, TicketTypeOut } from "@/lib/api/types";
import { localInputToIso } from "@/lib/format";
import { isWholeInRange, MAX_PRICE_KZT, MAX_QUANTITY } from "@/lib/forms";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { useCreateCampaign } from "../api";

interface Values {
  name: string;
  discount_type: DiscountType;
  discount_value: string;
  max_redemptions: string;
  starts_at: string;
  ends_at: string;
}

const EMPTY: Values = {
  name: "",
  discount_type: "percent",
  discount_value: "",
  max_redemptions: "",
  starts_at: "",
  ends_at: "",
};

const NAME_MAX = 120;

/** Same rules as the API's CampaignCreate, plus the 32-bit caps the API does not check yet. */
function validate(v: Values): MessageKey | null {
  const name = v.name.trim();
  if (!name || name.length > NAME_MAX) return "promo.campaign.nameRequired";
  if (v.discount_type === "percent" && !isWholeInRange(v.discount_value, 1, 100))
    return "promo.campaign.percentInvalid";
  if (v.discount_type === "fixed" && !isWholeInRange(v.discount_value, 1, MAX_PRICE_KZT))
    return "promo.campaign.fixedInvalid";
  if (v.max_redemptions.trim() && !isWholeInRange(v.max_redemptions, 1, MAX_QUANTITY))
    return "promo.campaign.limitInvalid";
  // Same zone for both fields, so the wall-clock strings compare correctly.
  if (v.starts_at && v.ends_at && v.ends_at <= v.starts_at) return "promo.campaign.datesOrder";
  return null;
}

function toPayload(v: Values, tz: string, ticketTypeIds: string[]): CampaignCreate {
  return {
    name: v.name.trim(),
    discount_type: v.discount_type,
    discount_value: Number(v.discount_value),
    max_redemptions: v.max_redemptions.trim() ? Number(v.max_redemptions) : null,
    // The venue's wall-clock time → UTC ISO with "Z" (the API wants aware datetimes).
    starts_at: localInputToIso(v.starts_at, tz),
    ends_at: localInputToIso(v.ends_at, tz),
    // None checked = every type of the event (the API's empty list).
    ticket_type_ids: ticketTypeIds,
  };
}

/** "Действует на типы билетов": none checked means every type. Hidden types can be chosen. */
function TicketTypePicker({
  types,
  selected,
  onToggle,
}: {
  types: TicketTypeOut[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium">{t("promo.campaign.types")}</legend>
      <p className="text-xs text-gray-600">{t("promo.campaign.typesHint")}</p>
      {types.length === 0 ? (
        <p className="text-sm text-gray-700">{t("promo.campaign.typesNone")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {types.map((type) => (
            <li key={type.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(type.id)}
                  onChange={() => onToggle(type.id)}
                />
                <span className={type.is_hidden ? "text-gray-500" : ""}>{type.name}</span>
                {type.is_hidden && (
                  <span className="rounded bg-gray-200 px-1.5 text-xs text-gray-700">
                    {t("preview.hiddenType")}
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export function CampaignForm({
  eventId,
  tz,
  ticketTypes,
  onDone,
}: {
  eventId: string;
  tz: string;
  /** The event's ticket types, hidden ones included (the organizer may target them). */
  ticketTypes: TicketTypeOut[];
  onDone: (created?: CampaignOut) => void;
}) {
  const { t } = useI18n();
  const create = useCreateCampaign(eventId);
  const [values, setValues] = useState<Values>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Values>) => setValues((prev) => ({ ...prev, ...patch }));
  const [typeIds, setTypeIds] = useState<ReadonlySet<string>>(new Set());
  const toggleType = (id: string) =>
    setTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const invalid = validate(values);
    if (invalid) return setError(t(invalid));
    try {
      // Only ids that are still types of this event (a type may have been deleted meanwhile).
      const ids = ticketTypes.filter((type) => typeIds.has(type.id)).map((type) => type.id);
      onDone(await create.mutateAsync(toPayload(values, tz, ids)));
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  const percent = values.discount_type === "percent";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-md bg-gray-50 p-4">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label={t("promo.campaign.name")}
          required
          maxLength={NAME_MAX}
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <SelectField
          label={t("promo.campaign.discountType")}
          value={values.discount_type}
          onChange={(e) => set({ discount_type: e.target.value as DiscountType })}
        >
          <option value="percent">{t("promo.discount.percent")}</option>
          <option value="fixed">{t("promo.discount.fixed")}</option>
        </SelectField>
        <FormField
          label={`${t("promo.campaign.discountValue")}, ${percent ? "%" : "₸"}`}
          type="number"
          min={1}
          max={percent ? 100 : MAX_PRICE_KZT}
          inputMode="numeric"
          required
          value={values.discount_value}
          onChange={(e) => set({ discount_value: e.target.value })}
        />
        <FormField
          label={t("promo.campaign.maxRedemptions")}
          hint={t("promo.campaign.maxRedemptionsHint")}
          type="number"
          min={1}
          inputMode="numeric"
          value={values.max_redemptions}
          onChange={(e) => set({ max_redemptions: e.target.value })}
        />
        <FormField
          label={t("promo.campaign.startsAt")}
          hint={t("promo.campaign.timesHint")}
          type="datetime-local"
          value={values.starts_at}
          onChange={(e) => set({ starts_at: e.target.value })}
        />
        <FormField
          label={t("promo.campaign.endsAt")}
          type="datetime-local"
          value={values.ends_at}
          onChange={(e) => set({ ends_at: e.target.value })}
        />
      </div>
      <TicketTypePicker types={ticketTypes} selected={typeIds} onToggle={toggleType} />
      <div className="flex gap-2">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? t("common.loading") : t("promo.campaign.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => onDone()}>
          {t("promo.campaign.cancel")}
        </Button>
      </div>
    </form>
  );
}
