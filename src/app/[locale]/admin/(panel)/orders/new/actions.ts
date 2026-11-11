"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { findCustomerByPhone } from "@/lib/customers";
import { readText, validateName, validatePhone } from "@/lib/order-validation";
import { createOrder } from "@/lib/orders";

export type NewOrderState = {
  errors: {
    name?: "nameRequired" | "nameTooLong";
    phone?: "phoneRequired" | "phoneInvalid";
  };
  /** Set when the phone already belongs to a customer with another name: the form asks first. */
  existingCustomerName?: string;
  /** The normalized phone that confirmation is for; a changed number is checked again. */
  confirmPhone?: string;
  /** What the user typed, so the form keeps it after an error. */
  values: { name: string; phone: string };
};

export async function createOrderAction(
  _previousState: NewOrderState,
  formData: FormData,
): Promise<NewOrderState> {
  // Server Actions are public endpoints: always check the login again here.
  await requireAdmin();

  const values = {
    name: readText(formData, "name"),
    phone: readText(formData, "phone"),
  };
  const name = validateName(values.name);
  const phone = validatePhone(values.phone);

  if (name.error !== undefined || phone.error !== undefined) {
    return { errors: { name: name.error, phone: phone.error }, values };
  }

  // One phone number is one customer. A different name is never saved silently:
  // the order goes to the existing customer, after the user confirms it.
  const existing = await findCustomerByPhone(phone.value);
  const confirmed = readText(formData, "confirmPhone") === phone.value;
  if (existing && existing.name !== name.value && !confirmed) {
    return { errors: {}, existingCustomerName: existing.name, confirmPhone: phone.value, values };
  }

  const order = await createOrder({ customerName: name.value, customerPhone: phone.value });

  redirect({
    href: { pathname: `/admin/orders/${order.id}`, query: { notice: "created" } },
    locale: await getLocale(),
  });
  return { errors: {}, values };
}
