import { useI18n } from "@/lib/i18n";

import { useAdminSettings } from "../hooks/useAdminQueries";
import { useFormat } from "../hooks/useFormat";
import { ListState } from "./ListState";

/** Platform fees, read-only (the API has no PUT yet). */
export function ActivationFeeTab() {
  const { t } = useI18n();
  const { money } = useFormat();
  const query = useAdminSettings();
  const data = query.data;

  return (
    <ListState
      isLoading={query.isFetching && !data}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={false}
    >
      {data && (
        <div className="max-w-md">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">{t("admin.fee.activation")}</dt>
              <dd className="font-semibold">{money(data.activation_fee_kzt)}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">{t("admin.fee.processing")}</dt>
              <dd className="font-semibold">{data.processing_fee_percent}%</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">{t("admin.fee.hold")}</dt>
              <dd className="font-semibold">
                {data.checkout_hold_minutes} {t("admin.fee.minutes")}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-gray-500">{t("admin.fee.readOnly")}</p>
        </div>
      )}
    </ListState>
  );
}
