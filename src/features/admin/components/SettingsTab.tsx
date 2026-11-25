import { Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api/client";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { errorText } from "../errors";
import { useAdminSettings, useUpdateSettings } from "../hooks/useAdminQueries";
import {
  draftFrom,
  invalidFields,
  SETTING_BOUNDS,
  SETTING_FIELDS,
  settingsPatch,
  type SettingField,
  type SettingsDraft,
} from "../settings";
import { ListState } from "./ListState";

const LABELS: Record<SettingField, MessageKey> = {
  activation_fee_kzt: "admin.fee.activation",
  processing_fee_percent: "admin.fee.processing",
  checkout_hold_minutes: "admin.fee.hold",
};
const UNITS: Record<SettingField, string> = {
  activation_fee_kzt: "₸",
  processing_fee_percent: "%",
  checkout_hold_minutes: "",
};

/** Platform fees and the checkout hold, editable (R-127, PATCH /admin/settings). */
export function SettingsTab() {
  const { t, lang } = useI18n();
  const query = useAdminSettings();
  const update = useUpdateSettings();
  const data = query.data;

  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Fill the form from the server (and again after a save).
  useEffect(() => {
    if (data) setDraft(draftFrom(data));
  }, [data]);

  const invalid = draft ? invalidFields(draft) : [];
  const patch = data && draft ? settingsPatch(data, draft) : {};
  const changed = Object.keys(patch).length > 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setSaved(false);
    setError(null);
    if (invalid.length || !changed) return;
    try {
      await update.mutateAsync(patch);
      setTouched(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 422 ? t("admin.settings.err.invalid") : errorText(err, t));
    }
  }

  const unitOf = (field: SettingField) =>
    field === "checkout_hold_minutes" ? t("admin.fee.minutes") : UNITS[field];

  return (
    <ListState
      isLoading={query.isFetching && !data}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={false}
    >
      {data && draft && (
        <form className="flex max-w-md flex-col gap-4" onSubmit={(e) => void submit(e)} noValidate>
          {SETTING_FIELDS.map((field) => {
            const { min, max } = SETTING_BOUNDS[field];
            const bad = invalid.includes(field) && (touched || draft[field] !== "");
            const range =
              field === "activation_fee_kzt"
                ? `${formatKzt(min, lang)} – ${formatKzt(max, lang)}`
                : `${min} – ${max} ${unitOf(field)}`;
            return (
              <FormField
                key={field}
                label={`${t(LABELS[field])}, ${unitOf(field)}`}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                step={1}
                value={draft[field]}
                onChange={(e) => {
                  setDraft({ ...draft, [field]: e.target.value });
                  setSaved(false);
                }}
                hint={`${t("admin.settings.range")}: ${range}`}
                error={bad ? t("admin.settings.err.range").replace("$1", range) : undefined}
              />
            );
          })}

          <p className="text-xs text-gray-600">
            {data.updated_at
              ? `${t("admin.settings.updatedAt")}: ${formatDateTime(data.updated_at, lang)}`
              : t("admin.settings.defaults")}
          </p>
          <p className="text-xs text-gray-600">{t("admin.settings.note")}</p>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="text-sm text-green-700">
              {t("admin.settings.saved")}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={!changed || invalid.length > 0 || update.isPending}>
              <Save className="mr-1 inline h-4 w-4" aria-hidden />
              {update.isPending ? t("admin.settings.saving") : t("admin.settings.save")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!changed || update.isPending}
              onClick={() => {
                setDraft(draftFrom(data));
                setTouched(false);
                setError(null);
              }}
            >
              {t("admin.settings.reset")}
            </Button>
          </div>
        </form>
      )}
    </ListState>
  );
}
