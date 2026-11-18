import type { EventStatus } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

const tone: Record<EventStatus, string> = {
  draft: "bg-yellow-100 text-yellow-900",
  published: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
  completed: "bg-gray-200 text-gray-900",
};

/** Status as text (not only colour). */
export function StatusBadge({ status }: { status: EventStatus }) {
  const { t } = useI18n();
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${tone[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}
