"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAllServices } from "@/lib/services";
import { LIMITS } from "@/lib/order-limits";
import { getOrderWithHistory, updateOrder } from "@/lib/orders";
import {
  parseLanguage,
  parsePriceToCents,
  readText,
  validateDate,
  validateName,
  validateOptionalText,
  validatePhone,
} from "@/lib/order-validation";

const FIELDS = [
  "name",
  "phone",
  "language",
  "serviceId",
  "clothingType",
  "publicDescription",
  "internalNote",
  "price",
  "estimatedReadyDate",
] as const;

type Field = (typeof FIELDS)[number];

export type EditOrderErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "phoneRequired"
  | "phoneInvalid"
  | "serviceInvalid"
  | "tooLong"
  | "priceInvalid"
  | "dateInvalid";

export type EditOrderState = {
  errors: Partial<Record<Field, EditOrderErrorKey>>;
  /** What the user typed, so the form keeps it after an error. */
  values: Record<Field, string> | null;
};

export async function updateOrderAction(
  _previousState: EditOrderState,
  formData: FormData,
): Promise<EditOrderState> {
  await requireAdmin();
  const locale = await getLocale();

  const orderId = readText(formData, "orderId");
  const current = await getOrderWithHistory(orderId);
  if (!current) {
    redirect({ href: "/admin/orders", locale });
    return { errors: {}, values: null };
  }

  const values = Object.fromEntries(
    FIELDS.map((field) => [field, readText(formData, field)]),
  ) as Record<Field, string>;

  const name = validateName(values.name);
  const phone = validatePhone(values.phone);
  const clothingType = validateOptionalText(values.clothingType, LIMITS.clothingType);
  const publicDescription = validateOptionalText(
    values.publicDescription,
    LIMITS.publicDescription,
  );
  const internalNote = validateOptionalText(values.internalNote, LIMITS.internalNote);
  const price = parsePriceToCents(values.price);
  const estimatedReadyDate = validateDate(values.estimatedReadyDate);

  // The service must exist: an active one, or the one the order already has.
  const services = await getAllServices();
  const serviceExists = services.some(
    (service) =>
      service.id === values.serviceId &&
      (service.isActive || service.id === current.order.serviceId),
  );
  const serviceError = values.serviceId && !serviceExists ? "serviceInvalid" : undefined;

  const errors: EditOrderState["errors"] = {
    name: name.error,
    phone: phone.error,
    serviceId: serviceError,
    clothingType: clothingType.error,
    publicDescription: publicDescription.error,
    internalNote: internalNote.error,
    price: price.error,
    estimatedReadyDate: estimatedReadyDate.error,
  };

  const hasErrors = Object.values(errors).some(Boolean);
  if (hasErrors || name.value === undefined || phone.value === undefined) {
    return { errors, values };
  }

  await updateOrder(orderId, {
    customerName: name.value,
    customerPhone: phone.value,
    customerLanguage: parseLanguage(values.language),
    serviceId: values.serviceId || null,
    clothingType: clothingType.value ?? null,
    publicDescription: publicDescription.value ?? null,
    internalNote: internalNote.value ?? null,
    priceCents: price.value ?? null,
    estimatedReadyDate: estimatedReadyDate.value ?? null,
  });

  redirect({
    href: { pathname: `/admin/orders/${orderId}`, query: { notice: "saved" } },
    locale,
  });
  return { errors: {}, values };
}
