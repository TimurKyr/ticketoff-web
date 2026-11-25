import { useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/api/errors";
import type { PromoCheckOut } from "@/lib/api/types";
import { formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { checkPromoCode, type PromoCheckItem } from "../api";

interface Props {
  eventId: string;
  value: string;
  onChange: (code: string) => void;
  /** The tickets picked so far: the check then gives the exact discount on them. */
  items?: PromoCheckItem[];
  /** The checked discount on these exact tickets for the code as typed, or null (order summary). */
  onDiscountChange?: (discountKzt: number | null) => void;
}

/** Same basket, same answer: a change of quantities or types makes an old result stale. */
function basketKey(items: PromoCheckItem[] | undefined): string {
  return (items ?? [])
    .map((item) => `${item.ticket_type_id}:${item.quantity}`)
    .sort()
    .join(",");
}

/**
 * Promo code input with a "check" button. With tickets picked, the server works out the
 * exact discount on them (the same calculation as checkout); without, only the terms.
 */
export function PromoCodeField({ eventId, value, onChange, items, onDiscountChange }: Props) {
  const { t, lang } = useI18n();
  const [checking, setChecking] = useState(false);
  // The result belongs to the code and the basket it was checked for: changing either hides it.
  const [result, setResult] = useState<{
    code: string;
    basket: string;
    ok?: PromoCheckOut;
    error?: string;
  } | null>(null);
  const basket = basketKey(items);
  const shown = result && result.code === value.trim() && result.basket === basket ? result : null;
  const discount = shown?.ok?.discount_kzt ?? null;
  useEffect(() => onDiscountChange?.(discount), [discount, onDiscountChange]);
  // Answers can arrive out of order (SAVE10, then SAVE20): only the latest check may set the result.
  const lastCheck = useRef(0);

  async function onCheck() {
    const code = value.trim();
    if (!code) return;
    const id = ++lastCheck.current;
    setChecking(true);
    try {
      const ok = await checkPromoCode(eventId, code, items);
      if (id === lastCheck.current) setResult({ code, basket, ok });
    } catch (err) {
      if (id === lastCheck.current) setResult({ code, basket, error: errorMessage(err, t) });
    } finally {
      if (id === lastCheck.current) setChecking(false);
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
          {shown.ok.discount_kzt != null
            ? // The server's discount on exactly the tickets picked (only the matching ones).
              `−${formatKzt(shown.ok.discount_kzt, lang)}. ${t("checkout.promoOnSelection")}`
            : `${
                shown.ok.discount_type === "percent"
                  ? `−${shown.ok.discount_value}%`
                  : `−${formatKzt(shown.ok.discount_value, lang)}`
              }. ${t("checkout.promoFinal")}`}
        </Alert>
      )}
      {shown?.error && <Alert tone="error">{shown.error}</Alert>}
    </div>
  );
}
