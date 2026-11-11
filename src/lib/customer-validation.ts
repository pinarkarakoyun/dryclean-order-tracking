// Server-side validation for the customer edit form, and where to go after saving.
// Pure functions, tested with node:test (relative imports end in ".ts").
import { isUuid } from "./ids.ts";
import { LIMITS } from "./order-limits.ts";
import { validateName, validateOptionalText, validatePhone } from "./order-validation.ts";

export type CustomerFormField = "name" | "phone" | "preferenceNote";

export type CustomerFormErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "phoneRequired"
  | "phoneInvalid"
  | "preferenceNoteTooLong";

export type CustomerFormValues = { name: string; phone: string; preferenceNote: string | null };

/** Values come trimmed (readText). The phone is returned in E.164; an empty note becomes null. */
export function validateCustomerForm(
  values: Record<CustomerFormField, string>,
):
  | { value: CustomerFormValues }
  | { errors: Partial<Record<CustomerFormField, CustomerFormErrorKey>> } {
  const name = validateName(values.name);
  const phone = validatePhone(values.phone);
  const note = validateOptionalText(values.preferenceNote, LIMITS.preferenceNote);

  if (name.error || phone.error || note.error) {
    const errors: Partial<Record<CustomerFormField, CustomerFormErrorKey>> = {};
    if (name.error) errors.name = name.error;
    if (phone.error) errors.phone = phone.error;
    if (note.error) errors.preferenceNote = "preferenceNoteTooLong";
    return { errors };
  }
  return { value: { name: name.value, phone: phone.value, preferenceNote: note.value } };
}

export type ReturnTo = { kind: "order"; orderId: string } | { kind: "customer" };

/**
 * Where to go after saving or cancelling. Only "order:<uuid>" leads to an order; everything else
 * goes to the customer page. The server builds the URL itself: form text is never used as a URL.
 */
export function parseReturnTo(from: string): ReturnTo {
  const prefix = "order:";
  if (from.startsWith(prefix)) {
    const orderId = from.slice(prefix.length);
    if (isUuid(orderId)) return { kind: "order", orderId };
  }
  return { kind: "customer" };
}
