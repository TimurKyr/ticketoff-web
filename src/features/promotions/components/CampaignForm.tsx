import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField, SelectField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import type { CampaignCreate, CampaignOut, DiscountType } from "@/lib/api/types";
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

function toPayload(v: Values, tz: string): CampaignCreate {
  return {
    name: v.name.trim(),
    discount_type: v.discount_type,
    discount_value: Number(v.discount_value),
    max_redemptions: v.max_redemptions.trim() ? Number(v.max_redemptions) : null,
    // The venue's wall-clock time → UTC ISO with "Z" (the API wants aware datetimes).
    starts_at: localInputToIso(v.starts_at, tz),
    ends_at: localInputToIso(v.ends_at, tz),
  };
}

export function CampaignForm({
  eventId,
  tz,
  onDone,
}: {
  eventId: string;
  tz: string;
  onDone: (created?: CampaignOut) => void;
}) {
  const { t } = useI18n();
  const create = useCreateCampaign(eventId);
  const [values, setValues] = useState<Values>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Values>) => setValues((prev) => ({ ...prev, ...patch }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const invalid = validate(values);
    if (invalid) return setError(t(invalid));
    try {
      onDone(await create.mutateAsync(toPayload(values, tz)));
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
