import { useState } from "react";

import { useI18n, type MessageKey } from "@/lib/i18n";

const TABS: { id: string; label: MessageKey }[] = [
  { id: "search", label: "admin.tab.search" },
  { id: "failedPayments", label: "admin.tab.failedPayments" },
  { id: "refunds", label: "admin.tab.refunds" },
  { id: "activations", label: "admin.tab.activations" },
  { id: "escalations", label: "admin.tab.escalations" },
  { id: "activationFee", label: "admin.tab.activationFee" },
];

/** Admin shell (platform_admin only, guarded in router.tsx). Tab bodies come with BE-22. */
export function AdminDashboardPage() {
  const { t } = useI18n();
  const [active, setActive] = useState(TABS[0].id);

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
            onClick={() => setActive(tab.id)}
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
        {/* TODO(FE-9): render each tab's content once BE-22 endpoints exist. */}
        <p className="text-sm text-gray-500">{t("admin.pendingBackend")}</p>
      </div>
    </div>
  );
}
