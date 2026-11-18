import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import type { EventCreate, EventOut, EventVisibility, VenueOut } from "@/lib/api/types";
import { DEFAULT_TIME_ZONE, isoToLocalInput, localInputToIso } from "@/lib/format";
import { isWholeInRange, MAX_QUANTITY, useSyncedValues } from "@/lib/forms";
import { useI18n, type MessageKey } from "@/lib/i18n";

const VISIBILITIES: EventVisibility[] = ["public", "unlisted", "private"];

interface Values {
  title: string;
  category: string;
  description: string;
  venue_id: string;
  start_at: string; // datetime-local in the venue's zone
  end_at: string;
  capacity: string;
  visibility: EventVisibility;
  registration_opens_at: string;
  registration_closes_at: string;
}

const DATE_FIELDS = ["start_at", "end_at", "registration_opens_at", "registration_closes_at"] as const;

function toValues(event: EventOut | undefined, tz: string): Values {
  return {
    title: event?.title ?? "",
    category: event?.category ?? "",
    description: event?.description ?? "",
    venue_id: event?.venue_id ?? "",
    start_at: isoToLocalInput(event?.start_at, tz),
    end_at: isoToLocalInput(event?.end_at, tz),
    capacity: event?.capacity != null ? String(event.capacity) : "",
    visibility: event?.visibility ?? "public",
    registration_opens_at: isoToLocalInput(event?.registration_opens_at, tz),
    registration_closes_at: isoToLocalInput(event?.registration_closes_at, tz),
  };
}

/** Form values → API payload (null for empty optional fields, dates in UTC). */
function toPayload(values: Values, tz: string): EventCreate {
  return {
    title: values.title.trim(),
    category: values.category.trim() || null,
    description: values.description.trim() || null,
    venue_id: values.venue_id,
    start_at: localInputToIso(values.start_at, tz) ?? "",
    end_at: localInputToIso(values.end_at, tz),
    capacity: values.capacity ? Number(values.capacity) : null,
    visibility: values.visibility,
    // Seat maps are not in the MVP UI: general admission only.
    seating_type: "general",
    registration_opens_at: localInputToIso(values.registration_opens_at, tz),
    registration_closes_at: localInputToIso(values.registration_closes_at, tz),
  };
}

/** Client-side checks that mirror the API's date rules (it checks them again). */
function validate(v: Values): MessageKey | null {
  if (!v.title.trim() || !v.venue_id || !v.start_at) return "org.form.required";
  if (v.capacity.trim() && !isWholeInRange(v.capacity, 1, MAX_QUANTITY)) return "org.form.capacityInvalid";
  // Same zone for all fields, so the wall-clock strings compare correctly.
  if (v.end_at && v.end_at <= v.start_at) return "err.endBeforeStart";
  if (v.registration_closes_at && v.registration_closes_at > v.start_at)
    return "err.regClosesAfterStart";
  if (
    v.registration_opens_at &&
    v.registration_closes_at &&
    v.registration_closes_at < v.registration_opens_at
  )
    return "err.regClosesBeforeOpens";
  return null;
}

interface Props {
  venues: VenueOut[];
  /** Edit mode when set: only changed fields are sent. */
  event?: EventOut;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (payload: Partial<EventCreate>) => Promise<unknown>;
  /** Message shown after a successful save (edit mode). */
  savedText?: string;
}

export function EventForm({ venues, event, submitLabel, disabled, onSubmit, savedText }: Props) {
  const { t } = useI18n();
  const initialTz = venues.find((v) => v.id === event?.venue_id)?.timezone ?? DEFAULT_TIME_ZONE;
  // Untouched fields follow the latest event from the server (after a save or a refetch).
  const [values, setValues] = useSyncedValues<Values>(toValues(event, initialTz));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tz = venues.find((v) => v.id === values.venue_id)?.timezone ?? DEFAULT_TIME_ZONE;
  const set = (patch: Partial<Values>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    setNotice(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const invalid = validate(values);
    if (invalid) return setError(t(invalid));

    const payload = toPayload(values, tz);
    let body: Partial<EventCreate> = payload;
    if (event) {
      const before = toPayload(toValues(event, initialTz), initialTz);
      // The venue's zone may differ from before, so compare dates as instants.
      body = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => {
          const old = before[key as keyof EventCreate];
          if ((DATE_FIELDS as readonly string[]).includes(key)) {
            return (value ? Date.parse(value as string) : null) !== (old ? Date.parse(old as string) : null);
          }
          return value !== old;
        })
      );
      if (Object.keys(body).length === 0) return setNotice(t("org.form.noChanges"));
    }

    setSubmitting(true);
    try {
      await onSubmit(body);
      if (savedText) setNotice(savedText);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  const dateField = (key: (typeof DATE_FIELDS)[number], label: MessageKey, required = false) => (
    <FormField
      label={t(label)}
      type="datetime-local"
      required={required}
      value={values[key]}
      onChange={(e) => set({ [key]: e.target.value } as Partial<Values>)}
      disabled={disabled}
    />
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      <FormField
        label={t("org.form.title")}
        required
        maxLength={200}
        value={values.title}
        onChange={(e) => set({ title: e.target.value })}
        disabled={disabled}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t("org.form.category")}
          hint={t("org.form.categoryHint")}
          value={values.category}
          onChange={(e) => set({ category: e.target.value })}
          disabled={disabled}
        />
        <SelectField
          label={t("org.form.visibility")}
          value={values.visibility}
          onChange={(e) => set({ visibility: e.target.value as EventVisibility })}
          disabled={disabled}
        >
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {t(`visibility.${v}`)}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        label={t("org.form.description")}
        value={values.description}
        onChange={(e) => set({ description: e.target.value })}
        disabled={disabled}
      />
      <SelectField
        label={t("org.form.venue")}
        required
        value={values.venue_id}
        onChange={(e) => set({ venue_id: e.target.value })}
        hint={`${t("org.form.timesHint")}: ${tz}`}
        disabled={disabled}
      >
        <option value="">{t("org.form.venuePick")}</option>
        {venues.map((venue) => (
          <option key={venue.id} value={venue.id}>
            {venue.name}
            {venue.city ? ` (${venue.city})` : ""}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        {dateField("start_at", "org.form.start", true)}
        {dateField("end_at", "org.form.end")}
        {dateField("registration_opens_at", "org.form.regOpens")}
        {dateField("registration_closes_at", "org.form.regCloses")}
      </div>
      <FormField
        label={t("org.form.capacity")}
        type="number"
        min={1}
        inputMode="numeric"
        value={values.capacity}
        onChange={(e) => set({ capacity: e.target.value })}
        disabled={disabled}
      />
      {!disabled && (
        <Button type="submit" disabled={submitting} className="self-start">
          {submitting ? t("common.loading") : submitLabel}
        </Button>
      )}
    </form>
  );
}
