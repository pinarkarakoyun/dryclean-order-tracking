// Quick price rules: the amounts shown as buttons in the item form. Pure functions, tested with node:test.
import type { QuickPrice } from "@/types/order-model";
import { parsePriceToCents } from "./order-validation.ts";

/** Fits in two rows of buttons on a phone, and keeps the choice small. */
export const MAX_QUICK_PRICES = 8;

export type QuickPriceErrorKey = "amountRequired" | "amountInvalid" | "duplicate" | "limit";

/**
 * A new quick price typed like a price ("175", "175,50", "₺ 175") -> kuruş.
 * `existing` is read on the server, so the limit holds even when the form is not shown.
 */
export function validateQuickPrice(
  raw: string,
  existing: QuickPrice[],
): { value: number } | { error: QuickPriceErrorKey } {
  if (existing.length >= MAX_QUICK_PRICES) return { error: "limit" };
  const parsed = parsePriceToCents(raw);
  if (parsed.error) return { error: "amountInvalid" };
  if (parsed.value === null) return { error: "amountRequired" };
  if (parsed.value === 0) return { error: "amountInvalid" };
  // Compared in kuruş, so "150" and "150,00" are the same amount.
  if (existing.some((price) => price.amountKurus === parsed.value)) return { error: "duplicate" };
  return { value: parsed.value };
}

/** Low to high; returns a new array. */
export function sortQuickPrices(prices: QuickPrice[]): QuickPrice[] {
  return [...prices].sort((a, b) => a.amountKurus - b.amountKurus);
}
