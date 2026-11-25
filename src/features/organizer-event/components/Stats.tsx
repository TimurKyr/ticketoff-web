import { ReactNode } from "react";

import { formatDecimal, formatPercent } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

/** One number with its label; `hint` is a short line under the number. */
export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-gray-50 p-3">
      <dt className="text-xs text-gray-600">{label}</dt>
      <dd className="break-words text-xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-xs text-gray-600">{hint}</dd>}
    </div>
  );
}

/** A grid of StatCards: 2 columns on a phone, more on wider screens. */
export function StatGrid({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <dl aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </dl>
  );
}

/** Every amount here is simulated (the API's is_simulated): said next to the money. */
export function SimulationBadge() {
  const { t } = useI18n();
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
      {t("orgEvent.simulation")}
    </span>
  );
}

/**
 * The 0–100 numbers the API gives (one decimal) as "12,5 %" (ru, kk) or "12.5%" (en). By hand,
 * not Intl: browsers lack reliable "kk" data (see lib/format).
 */
export function Percent({ value }: { value: number }) {
  const { lang } = useI18n();
  const text = Number.isInteger(value) ? String(value) : formatDecimal(value, lang);
  return <>{formatPercent(text, lang)}</>;
}

/** Shown at the top of a tab on a past or cancelled event. */
export function ReadOnlyNote() {
  const { t } = useI18n();
  return (
    <p className="rounded-md border-l-4 border-gray-400 bg-gray-50 px-3 py-2 text-sm text-gray-800">
      {t("orgEvent.readOnly")}
    </p>
  );
}
