import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/api/errors";
import type { OrderOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { cancelOrder } from "../api";

/** Cancel with a second confirming click. The tickets go back on sale. */
export function CancelOrderButton({ order }: { order: OrderOut }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setBusy(true);
    setError(null);
    try {
      const updated = await cancelOrder(order.id);
      queryClient.setQueryData(["orders", order.id], updated);
      setConfirming(false);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["events", "ticket-types", order.event_id] });
    }
  }

  const question = order.status === "pending" ? t("cancel.confirmPending") : t("cancel.confirmFree");

  return (
    <div className="flex flex-col items-start gap-2">
      {error && <Alert tone="error">{error}</Alert>}
      {confirming ? (
        <div role="group" aria-label={question} className="flex flex-col gap-2 rounded-md border border-red-300 bg-red-50 p-3">
          <p className="text-sm">{question}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={onConfirm} disabled={busy}>
              {busy ? t("common.loading") : t("cancel.yes")}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
              {t("cancel.no")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          {order.status === "pending" ? t("cancel.pending") : t("cancel.free")}
        </Button>
      )}
    </div>
  );
}
