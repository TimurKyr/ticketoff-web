import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ErrorState, Loading } from "@/components/ui/States";
import { errorMessage } from "@/lib/api/errors";
import { formatKzt } from "@/lib/format";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { useActivation, useActivationStep, type ActivationStep } from "../api";
import { ActivationFeeDialog, PaidSalesTermsDialog } from "./PaidSalesTermsDialog";

/** Checklist for turning on paid sales. Every step is simulated (no real KYC or money). */
export function ActivationSection({ eventId, editable }: { eventId: string; editable: boolean }) {
  const { t, lang } = useI18n();
  const activation = useActivation(eventId, true);
  const step = useActivationStep(eventId);
  const [error, setError] = useState<string | null>(null);
  // Accepting the terms and paying the fee first show what is being agreed to (FE-22 #7).
  const [dialog, setDialog] = useState<"accept-terms" | "pay" | null>(null);

  async function run(name: ActivationStep) {
    setError(null);
    try {
      await step.mutateAsync(name);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setDialog(null);
    }
  }

  function start(name: ActivationStep) {
    if (name === "accept-terms" || name === "pay") setDialog(name);
    else void run(name);
  }

  if (activation.isPending) return <Loading />;
  if (activation.isError) return <ErrorState error={activation.error} onRetry={() => activation.refetch()} />;
  const c = activation.data;

  const items: [done: boolean, label: MessageKey, action?: ActivationStep, actionLabel?: MessageKey][] = [
    [c.has_paid_ticket_type, "org.act.needPaidType"],
    [c.identity_verified && c.payout_account_ready, "org.act.verified", "simulate-verification", "org.act.doVerify"],
    [c.terms_accepted, "org.act.terms", "accept-terms", "org.act.doTerms"],
    [c.activation_fee_paid, "org.act.fee", "pay", "org.act.doPay"],
  ];

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <h2 className="text-xl font-semibold">{t("org.act.title")}</h2>
      <p className="text-sm text-gray-700">{t("org.act.simulated")}</p>
      {c.active && <Alert tone="success">{t("org.act.active")}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      <ul className="flex flex-col gap-2">
        {items.map(([done, label, action, actionLabel]) => (
          <li key={label} className="flex flex-wrap items-center justify-between gap-2">
            <span>
              <span aria-hidden="true">{done ? "✅" : "⬜"}</span> {t(label)}
              {label === "org.act.fee" && ` (${formatKzt(c.activation_fee_kzt, lang)})`}
              <span className="sr-only"> — {done ? t("org.act.done") : t("org.act.todo")}</span>
            </span>
            {!done && action && actionLabel && editable && (
              <Button variant="secondary" onClick={() => start(action)} disabled={step.isPending}>
                {t(actionLabel)}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {!c.terms_accepted && editable && (
        <button
          type="button"
          onClick={() => setDialog("accept-terms")}
          className="self-start text-sm underline"
        >
          {t("org.terms.read")}
        </button>
      )}
      {dialog === "accept-terms" && (
        <PaidSalesTermsDialog
          feeKzt={c.activation_fee_kzt}
          pending={step.isPending}
          onAccept={() => void run("accept-terms")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "pay" && (
        <ActivationFeeDialog
          feeKzt={c.activation_fee_kzt}
          pending={step.isPending}
          onPay={() => void run("pay")}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
