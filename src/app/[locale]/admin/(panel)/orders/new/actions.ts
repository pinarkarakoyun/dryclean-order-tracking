"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import {
  parseLanguage,
  readText,
  validateName,
  validatePhone,
} from "@/lib/order-validation";

export type NewOrderState = {
  errors: {
    name?: "nameRequired" | "nameTooLong";
    phone?: "phoneRequired" | "phoneInvalid";
  };
  /** What the user typed, so the form keeps it after an error. */
  values: { name: string; phone: string; language: string };
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
    language: readText(formData, "language"),
  };
  const name = validateName(values.name);
  const phone = validatePhone(values.phone);

  if (name.error !== undefined || phone.error !== undefined) {
    return { errors: { name: name.error, phone: phone.error }, values };
  }

  const order = await createOrder({
    customerName: name.value,
    customerPhone: phone.value,
    customerLanguage: parseLanguage(values.language),
  });

  redirect({
    href: { pathname: `/admin/orders/${order.id}`, query: { notice: "created" } },
    locale: await getLocale(),
  });
  return { errors: {}, values };
}
