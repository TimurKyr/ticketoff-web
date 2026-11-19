import { useI18n } from "@/lib/i18n";

/** The organizer's refund terms, shown before paying. Refunds are done by the organizer. */
export function RefundPolicy({ policy }: { policy: string | null | undefined }) {
  const { t } = useI18n();
  return (
    <section className="rounded-md bg-gray-50 p-3 text-sm" aria-labelledby="refund-policy-title">
      <h3 id="refund-policy-title" className="mb-1 font-medium">
        {t("checkout.refundPolicy")}
      </h3>
      <p className="whitespace-pre-line text-gray-800">{policy?.trim() || t("checkout.refundPolicyNone")}</p>
      <p className="mt-1 text-xs text-gray-600">{t("checkout.refundByOrganizer")}</p>
    </section>
  );
}
