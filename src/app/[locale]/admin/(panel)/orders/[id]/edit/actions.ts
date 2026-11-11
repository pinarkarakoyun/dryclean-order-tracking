"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { LIMITS } from "@/lib/order-limits";
import {
  readText,
  validateDate,
  validateExpress,
  validateOptionalText,
} from "@/lib/order-validation";
import { updateOrder } from "@/lib/orders";

const FIELDS = ["express", "estimatedReadyDate", "publicDescription", "internalNote"] as const;

type Field = (typeof FIELDS)[number];

export type EditOrderErrorKey = "tooLong" | "dateInvalid";

export type EditOrderState = {
  errors: Partial<Record<Field, EditOrderErrorKey>>;
  /** What the user typed, so the form keeps it after an error. */
  values: Record<Field, string> | null;
};

/** Saves the order fields. Customer details are edited separately (roadmap step 5). */
export async function updateOrderAction(
  _previousState: EditOrderState,
  formData: FormData,
): Promise<EditOrderState> {
  await requireAdmin();
  const locale = await getLocale();

  const orderId = readText(formData, "orderId");
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, readText(formData, field)]),
  ) as Record<Field, string>;

  const estimatedReadyDate = validateDate(values.estimatedReadyDate);
  const publicDescription = validateOptionalText(values.publicDescription, LIMITS.publicDescription);
  const internalNote = validateOptionalText(values.internalNote, LIMITS.internalNote);

  const errors: EditOrderState["errors"] = {
    estimatedReadyDate: estimatedReadyDate.error,
    publicDescription: publicDescription.error,
    internalNote: internalNote.error,
  };
  if (Object.values(errors).some(Boolean)) {
    return { errors, values };
  }

  const saved = await updateOrder(orderId, {
    expressPercent: validateExpress(values.express),
    estimatedReadyDate: estimatedReadyDate.value ?? null,
    publicDescription: publicDescription.value ?? null,
    internalNote: internalNote.value ?? null,
  });
  if (!saved) {
    redirect({ href: "/admin/orders", locale });
    return { errors: {}, values: null };
  }

  redirect({
    href: { pathname: `/admin/orders/${orderId}`, query: { notice: "saved" } },
    locale,
  });
  return { errors: {}, values };
}
