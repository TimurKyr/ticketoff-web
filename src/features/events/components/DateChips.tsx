import { useRef, useState } from "react";

import { isValidDay } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { DATE_PRESETS, activePreset, presetRange, type DayRange } from "../dateRanges";

const chip =
  "inline-flex h-10 shrink-0 items-center rounded-[10px] border px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2448C9]";
const on = "border-[#1A1A18] bg-[#1A1A18] text-white";
const off = "border-[#8F8C85] bg-white text-[#1A1A18] hover:bg-[#F5F4F1]";

const LABELS = {
  today: "dates.today",
  tomorrow: "dates.tomorrow",
  weekend: "dates.weekend",
} as const;

/**
 * "Сегодня / Завтра / Выходные / Дата…". `from`/`to` are days "YYYY-MM-DD" (Almaty);
 * picking the active chip again clears the range (onChange(null)).
 */
export function DateChips({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: DayRange | null) => void;
}) {
  const { t } = useI18n();
  const now = new Date();
  const active = activePreset(from, to, now);
  const custom = !active && Boolean(from) && from === to && isValidDay(from);
  const [picking, setPicking] = useState(false);
  const dateInput = useRef<HTMLInputElement>(null);

  function openPicker() {
    setPicking(true);
    // Let the input render, then focus it and open the native picker where supported.
    requestAnimationFrame(() => {
      const input = dateInput.current;
      if (!input) return;
      input.focus();
      try {
        input.showPicker?.();
      } catch {
        // showPicker needs a user gesture in some browsers; focus is enough then
      }
    });
  }

  return (
    <div
      role="group"
      aria-label={t("dates.label")}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {DATE_PRESETS.map((preset) => {
        // On Sunday "Сегодня" and "Выходные" are the same day, so both light up.
        const range = presetRange(preset, now);
        const isOn = range.from === from && range.to === to;
        return (
          <button
            key={preset}
            type="button"
            aria-pressed={isOn}
            className={`${chip} ${isOn ? on : off}`}
            onClick={() => onChange(isOn ? null : range)}
          >
            {t(LABELS[preset])}
          </button>
        );
      })}
      {picking || custom ? (
        <label className={`${chip} ${custom ? on : off} gap-2 pr-2`}>
          <span className="sr-only">{t("dates.pick")}</span>
          <input
            ref={dateInput}
            type="date"
            value={custom ? from : ""}
            onChange={(e) => {
              const day = e.target.value;
              onChange(isValidDay(day) ? { from: day, to: day } : null);
            }}
            onBlur={() => setPicking(false)}
            className={`bg-transparent text-sm outline-none ${custom ? "[color-scheme:dark]" : ""}`}
          />
        </label>
      ) : (
        <button type="button" aria-pressed={false} className={`${chip} ${off}`} onClick={openPicker}>
          {t("dates.pick")}
        </button>
      )}
    </div>
  );
}
