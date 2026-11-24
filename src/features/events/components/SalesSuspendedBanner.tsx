import { CirclePause } from "lucide-react";

import { useI18n } from "@/lib/i18n";

/**
 * A platform admin suspended sales of this event (FE-22 #1, `EventOut.sales_suspended`).
 * Buyers see it instead of the order forms; the organizer sees it on the event's page in
 * the dashboard, with what it means for them.
 */
export function SalesSuspendedBanner({ audience }: { audience: "buyer" | "organizer" }) {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-[#E8C9A0] bg-[#FCF1D9] p-4 text-[#5C3A00]"
    >
      <CirclePause aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{t("events.salesSuspended.title")}</p>
        <p className="text-sm">
          {t(audience === "buyer" ? "events.salesSuspended.buyer" : "events.salesSuspended.organizer")}
        </p>
      </div>
    </div>
  );
}

/** Short form for lists (the organizer's "My events"). */
export function SalesSuspendedBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 rounded bg-[#FCF1D9] px-2 py-0.5 text-xs font-medium text-[#5C3A00]">
      <CirclePause aria-hidden className="h-3 w-3" />
      {t("events.salesSuspended.badge")}
    </span>
  );
}
