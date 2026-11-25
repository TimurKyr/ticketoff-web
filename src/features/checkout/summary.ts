/** One line of the order summary: a ticket type and how many of it. */
export interface SummaryLine {
  id: string;
  name: string;
  quantity: number;
  price_kzt: number;
}

export interface OrderSummary {
  lines: (SummaryLine & { sum_kzt: number })[];
  subtotal_kzt: number;
  /** From the promo check on exactly these tickets; null when there is none (yet). */
  discount_kzt: number | null;
  total_kzt: number;
}

/**
 * The total before "Перейти к оплате" (FE-22 #6): list prices times quantities, minus the
 * discount the server worked out for this basket. The server still sets the final amount.
 */
export function orderSummary(lines: SummaryLine[], discountKzt: number | null): OrderSummary {
  const withSums = lines
    .filter((line) => line.quantity > 0)
    .map((line) => ({ ...line, sum_kzt: line.price_kzt * line.quantity }));
  const subtotal = withSums.reduce((sum, line) => sum + line.sum_kzt, 0);
  const discount = discountKzt && discountKzt > 0 ? Math.min(discountKzt, subtotal) : null;
  return {
    lines: withSums,
    subtotal_kzt: subtotal,
    discount_kzt: discount,
    total_kzt: subtotal - (discount ?? 0),
  };
}
