import { useI18n, type MessageKey } from "@/lib/i18n";

const COLORS: Record<string, string> = {
  succeeded: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

/** Payment / refund status. Unknown statuses fall back to the raw value. */
export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const label = t(`admin.status.${status}` as MessageKey) || status;
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs ${COLORS[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {label}
    </span>
  );
}
