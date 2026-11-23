import type { Availability } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

// Dot + word, the colour only backs the text (brief §6). Tones: warning, neutral.
const TONE = {
  few_left: { box: "bg-[#FCF1D9] text-[#7A4D00]", label: "events.fewLeft" },
  sold_out: { box: "bg-[#EFEEEA] text-[#45433F]", label: "events.soldOutBadge" },
} as const;

export function AvailabilityBadge({ availability }: { availability: Availability | null | undefined }) {
  const { t } = useI18n();
  if (availability !== "few_left" && availability !== "sold_out") return null;
  const tone = TONE[availability];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${tone.box}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(tone.label)}
    </span>
  );
}
