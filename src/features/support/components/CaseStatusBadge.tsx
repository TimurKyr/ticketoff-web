import type { SupportStatus } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { statusLabel } from "../labels";

const CLASSES: Record<SupportStatus, string> = {
  open: "bg-blue-100 text-blue-900",
  in_progress: "bg-amber-100 text-amber-900",
  waiting_customer: "bg-purple-100 text-purple-900",
  resolved: "bg-green-100 text-green-900",
};

/** `asHandler`: the handler's wording (see statusLabel); default is the customer's. */
export function CaseStatusBadge({ status, asHandler = false }: { status: SupportStatus; asHandler?: boolean }) {
  const { t } = useI18n();
  return (
    <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${CLASSES[status]}`}>
      {t(statusLabel(status, asHandler))}
    </span>
  );
}
