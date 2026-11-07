import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { LIMITS } from "./order-limits";
import { normalizePhone } from "./phone";

// Server-side validation shared by the "new order" and "edit order" forms.
// Each function returns either a clean value or an error key (translated in the UI).

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

/** Unknown values fall back to Dutch instead of failing: it is not worth an error message. */
export function parseLanguage(input: string): Locale {
  return hasLocale(routing.locales, input) ? input : routing.defaultLocale;
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
 * Optional price in euros, e.g. "15", "15,50", "15.50" or "€ 15,50" -> cents (1550).
 * Thousand separators are not accepted, to avoid confusing "1.500" (Dutch) with 1.5.
 */
export function parsePriceToCents(input: string): Result<number | null, "priceInvalid"> {
  const cleaned = input.replace(/€/g, "").replace(/\s/g, "");
  if (!cleaned) return { value: null };
  if (!/^\d+([.,]\d{1,2})?$/.test(cleaned)) return { error: "priceInvalid" };

  const euros = Number(cleaned.replace(",", "."));
  if (euros > LIMITS.priceEuros) return { error: "priceInvalid" };
  // Math.round avoids floating point errors like 19.99 * 100 = 1998.9999999999998.
  return { value: Math.round(euros * 100) };
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
