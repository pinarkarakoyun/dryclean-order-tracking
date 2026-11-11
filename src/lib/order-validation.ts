import { EXPRESS_PERCENT, LIMITS } from "./order-limits.ts";
import { normalizePhone } from "./phone.ts";

// Server-side validation shared by the order forms.
// Each function returns either a clean value or an error key (translated in the UI).
// Relative imports end in ".ts" so node:test can run this file directly.

type Result<T, E extends string> = { value: T; error?: undefined } | { value?: undefined; error: E };

/** Reads a form field as trimmed text ("" if missing). */
export function readText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export function validateName(input: string): Result<string, "nameRequired" | "nameTooLong"> {
  if (!input) return { error: "nameRequired" };
  if (input.length > LIMITS.name) return { error: "nameTooLong" };
  return { value: input };
}

export function validatePhone(input: string): Result<string, "phoneRequired" | "phoneInvalid"> {
  if (!input) return { error: "phoneRequired" };
  const phone = input.length <= LIMITS.phone ? normalizePhone(input) : null;
  return phone ? { value: phone } : { error: "phoneInvalid" };
}

/** Optional text: empty becomes null. */
export function validateOptionalText(
  input: string,
  maxLength: number,
): Result<string | null, "tooLong"> {
  if (input.length > maxLength) return { error: "tooLong" };
  return { value: input || null };
}

/**
 * Optional price in lira, e.g. "150", "150,50", "150.50" or "₺ 150" -> kuruş (15050).
 * Thousand separators are not accepted, to avoid confusing "1.500" (Turkish) with 1.5.
 */
export function parsePriceToCents(input: string): Result<number | null, "priceInvalid"> {
  const cleaned = input.replace(/[€₺]/g, "").replace(/\s/g, "");
  if (!cleaned) return { value: null };
  if (!/^\d+([.,]\d{1,2})?$/.test(cleaned)) return { error: "priceInvalid" };

  const lira = Number(cleaned.replace(",", "."));
  if (lira > LIMITS.priceLira) return { error: "priceInvalid" };
  // Math.round avoids floating point errors like 19.99 * 100 = 1998.9999999999998.
  return { value: Math.round(lira * 100) };
}

/**
 * Where a new order item comes from: the price list OR a typed name, never both silently.
 * The list item id is checked against the database by the caller.
 */
export function resolveItemSource(
  priceListItemId: string,
  customName: string,
): Result<
  { kind: "list"; id: string } | { kind: "custom"; name: string },
  "nameRequired" | "bothGiven" | "tooLong"
> {
  if (priceListItemId && customName) return { error: "bothGiven" };
  if (priceListItemId) return { value: { kind: "list", id: priceListItemId } };
  if (!customName) return { error: "nameRequired" };
  if (customName.length > LIMITS.garmentName) return { error: "tooLong" };
  return { value: { kind: "custom", name: customName } };
}

/**
 * Price of a new order item. It only comes from the price box: the same garment type is not
 * always the same price, so products have no price. An empty box means "no price yet".
 */
export function resolveItemPrice(typed: string): Result<number | null, "priceInvalid"> {
  return parsePriceToCents(typed);
}

/**
 * The "express" checkbox (ticked sends "on") -> the surcharge to store on the order.
 * An order that is already express keeps its stored rate: the rate is copied once (spec §3),
 * so a later change of EXPRESS_PERCENT never changes an old order's total.
 */
export function validateExpress(input: string, storedPercent: number | null): number | null {
  if (input !== "on") return null;
  return storedPercent ?? EXPRESS_PERCENT;
}

/** Optional date "YYYY-MM-DD" (what <input type="date"> sends). */
export function validateDate(input: string): Result<string | null, "dateInvalid"> {
  if (!input) return { value: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return { error: "dateInvalid" };
  // Rejects impossible dates such as 2026-02-31 (JavaScript would roll them over to March).
  const date = new Date(`${input}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) {
    return { error: "dateInvalid" };
  }
  return { value: input };
}
