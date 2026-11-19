import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/api/errors";
import type { PromoCheckOut } from "@/lib/api/types";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { checkPromoCode } from "../api";

interface Props {
  eventId: string;
  value: string;
  onChange: (code: string) => void;
}

/**
 * Promo code input with a "check" button. The check only shows the campaign's terms;
 * the real discount on this order is worked out by the server at checkout.
 */
export function PromoCodeField({ eventId, value, onChange }: Props) {
  const { t, lang } = useI18n();
  const [checking, setChecking] = useState(false);
  // The result belongs to the code it was checked for: typing something else hides it.
  const [result, setResult] = useState<{ code: string; ok?: PromoCheckOut; error?: string } | null>(null);
  const shown = result && result.code === value.trim() ? result : null;

  async function onCheck() {
    const code = value.trim();
    if (!code) return;
    setChecking(true);
    try {
      setResult({ code, ok: await checkPromoCode(eventId, code) });
    } catch (err) {
      setResult({ code, error: errorMessage(err, t) });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`promo-${eventId}`} className="text-sm font-medium">
        {t("checkout.promo")}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={`promo-${eventId}`}
          value={value}
          maxLength={64}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-gray-400 px-3 py-2 font-mono uppercase"
        />
        <Button type="button" variant="secondary" onClick={onCheck} disabled={checking || !value.trim()}>
          {checking ? t("common.loading") : t("checkout.promoCheck")}
        </Button>
      </div>
      {shown?.ok && (
        <Alert tone="success">
          {t("checkout.promoOk")} «{shown.ok.campaign_name}»:{" "}
          {shown.ok.discount_type === "percent"
            ? `−${shown.ok.discount_value}%`
            : `−${formatKzt(shown.ok.discount_value, lang)}`}
          . {t("checkout.promoFinal")}
        </Alert>
      )}
      {shown?.error && <Alert tone="error">{shown.error}</Alert>}
    </div>
  );
}
