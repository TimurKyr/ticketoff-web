
import { useSearchParams } from "react-router-dom";

import { useI18n, type MessageKey } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { ActivationFeeTab } from "../components/ActivationFeeTab";
import { ActivationsTab } from "../components/ActivationsTab";
import { FailedPaymentsTab } from "../components/FailedPaymentsTab";
import { RefundsTab } from "../components/RefundsTab";
import { ReportsTab } from "../components/ReportsTab";
import { SearchTab } from "../components/SearchTab";

const TABS = [
  { id: "search", label: "admin.tab.search" },
  { id: "failedPayments", label: "admin.tab.failedPayments" },
  { id: "refunds", label: "admin.tab.refunds" },
  { id: "reports", label: "admin.tab.reports" },
  { id: "activations", label: "admin.tab.activations" },
  { id: "activationFee", label: "admin.tab.activationFee" },
] as const satisfies readonly { id: string; label: MessageKey }[];

type TabId = (typeof TABS)[number]["id"];

/** Admin portal (platform_admin only, guarded in router.tsx). */
export function AdminDashboardPage() {
  const { t } = useI18n();
  useDocumentTitle(t("admin.title"));

  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const active: TabId =
    TABS.find((tab) => tab.id === requested)?.id ?? "search";

  const select = (id: TabId) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", id);
        return next;
      },
      { replace: true }
    );

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t("admin.title")}</h1>

      <div role="tablist" className="mb-6 flex flex-wrap gap-2 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => select(tab.id)}
            className={
              active === tab.id
                ? "border-b-2 border-black px-3 py-2 text-sm font-semibold"
                : "px-3 py-2 text-sm text-gray-600"
            }
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {active === "search" && <SearchTab />}
        {active === "failedPayments" && <FailedPaymentsTab />}
        {active === "refunds" && <RefundsTab />}
        {active === "reports" && <ReportsTab />}
        {active === "activations" && <ActivationsTab />}
        {active === "activationFee" && <ActivationFeeTab />}
      </div>
    </div>
  );
}
