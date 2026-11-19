import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/api/errors";
import type { OrderOut } from "@/lib/api/types";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { payOrder } from "../api";
import { amountDue } from "../order";

/**
 * Simulated payment of a pending order. There is no payment provider: the buyer picks the
 * card result. A failed payment keeps the order pending, so it can be tried again until
 * the hold runs out.
 */
export function PaymentPanel({ order, onPaid }: { order: OrderOut; onPaid: () => void }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error"; text: string } | null>(null);

  async function pay(simulate: "success" | "fail") {
    setBusy(true);
    setMessage(null);
    try {
      const result = await payOrder(order.id, simulate);
      queryClient.setQueryData(["orders", order.id], result.order);
      void queryClient.invalidateQueries({ queryKey: ["orders", "me"] });
      if (result.payment.status === "succeeded") {
        void queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", order.event_id] });
        onPaid();
      } else {
        setMessage({ tone: "error", text: t("pay.failed") });
      }
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err, t) });
      // e.g. the hold ran out: the server has cancelled the order, show its new state.
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", order.event_id] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="demo-pay-title"
      className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-amber-600 bg-amber-50 p-4"
    >
      <h2 id="demo-pay-title" className="text-lg font-semibold">
        {t("pay.title")}
      </h2>
      <p className="text-sm text-gray-800">{t("pay.demoNote")}</p>
      <p className="text-base">
        {t("pay.amount")}: <strong>{formatKzt(amountDue(order), lang)}</strong>
      </p>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => pay("success")} disabled={busy}>
          {busy ? t("common.loading") : t("pay.success")}
        </Button>
        <Button variant="secondary" onClick={() => pay("fail")} disabled={busy}>
          {t("pay.fail")}
        </Button>
      </div>
    </section>
  );
}
