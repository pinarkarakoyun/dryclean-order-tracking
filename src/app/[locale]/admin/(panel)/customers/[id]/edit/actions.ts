"use server";

import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  parseReturnTo,
  validateCustomerForm,
  type CustomerFormErrorKey,
  type CustomerFormField,
} from "@/lib/customer-validation";
import { updateCustomer } from "@/lib/customers";
import { readText } from "@/lib/order-validation";

const FIELDS = ["name", "phone", "preferenceNote"] as const satisfies readonly CustomerFormField[];

export type EditCustomerState = {
  errors: Partial<Record<CustomerFormField, CustomerFormErrorKey>>;
  /** What the user typed, so the form keeps it after an error. */
  values: Record<CustomerFormField, string> | null;
  /** Set when the phone number belongs to another customer. */
  phoneOwner: { id: string; name: string } | null;
};

/** Saves the customer, then returns to the order or customer page it was opened from. */
export async function updateCustomerAction(
  _previousState: EditCustomerState,
  formData: FormData,
): Promise<EditCustomerState> {
  await requireAdmin();
  const locale = await getLocale();

  const customerId = readText(formData, "customerId");
  const returnTo = parseReturnTo(readText(formData, "from"));
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, readText(formData, field)]),
  ) as Record<CustomerFormField, string>;

  const validated = validateCustomerForm(values);
  if ("errors" in validated) {
    return { errors: validated.errors, values, phoneOwner: null };
  }

  const result = await updateCustomer(customerId, validated.value);
  if (!result.ok) {
    if (result.reason === "notFound") notFound();
    return { errors: {}, values, phoneOwner: result.owner };
  }

  redirect({
    href:
      returnTo.kind === "order"
        ? { pathname: `/admin/orders/${returnTo.orderId}`, query: { notice: "customerSaved" } }
        : { pathname: `/admin/customers/${customerId}`, query: { notice: "saved" } },
    locale,
  });
  return { errors: {}, values, phoneOwner: null };
}
