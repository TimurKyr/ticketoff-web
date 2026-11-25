import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import type { OrderSummary } from "../summary";

/** "Итого" under the ticket choice, before the checkout button (FE-22 #6). */
export function OrderSummaryBox({
  summary,
  promoUnchecked,
}: {
  summary: OrderSummary;
  /** A code is typed but not checked yet: its discount is not in the total. */
  promoUnchecked: boolean;
}) {
  const { t, lang } = useI18n();
  if (summary.lines.length === 0) return null;
  return (
    <section
      aria-label={t("checkout.summary.title")}
      className="flex flex-col gap-2 rounded-2xl bg-[#F5F4F1] p-4 text-sm"
      data-testid="order-summary"
    >
      <h4 className="font-semibold">{t("checkout.summary.title")}</h4>
      <ul className="flex flex-col gap-1">
        {summary.lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-3">
            <span>
              {line.name} × {line.quantity}
            </span>
            <span className="tabular-nums">{formatKzt(line.sum_kzt, lang)}</span>
          </li>
        ))}
      </ul>
      {summary.discount_kzt != null && (
        <p className="flex justify-between gap-3 text-green-800">
          <span>{t("checkout.summary.discount")}</span>
          <span className="tabular-nums">−{formatKzt(summary.discount_kzt, lang)}</span>
        </p>
      )}
      <p className="flex justify-between gap-3 border-t border-[#E4E1DA] pt-2 text-base font-semibold">
        <span>{t("checkout.summary.total")}</span>
        <span className="tabular-nums">{formatKzt(summary.total_kzt, lang)}</span>
      </p>
      {promoUnchecked && <p className="text-xs text-gray-700">{t("checkout.summary.promoUnchecked")}</p>}
    </section>
  );
}
