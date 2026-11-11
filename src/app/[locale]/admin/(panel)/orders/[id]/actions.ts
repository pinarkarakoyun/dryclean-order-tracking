"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { canQuickChange } from "@/lib/item-status";
import { LIMITS } from "@/lib/order-limits";
import {
  readText,
  resolveItemPrice,
  validateOptionalText,
} from "@/lib/order-validation";
import { addOrderItem, changeItemStatus } from "@/lib/orders";
import { getPriceListItem } from "@/lib/price-list";
import { ITEM_STATUSES } from "@/types/order-model";

/** Called by the status buttons of one garment on the order detail page. */
export async function changeItemStatusAction(formData: FormData): Promise<void> {
  // Server Actions are public endpoints: always check the login again here.
  await requireAdmin();
  const locale = await getLocale();

  const orderId = readText(formData, "orderId");
  const itemId = readText(formData, "itemId");
  // Only known statuses are accepted.
  const expected = ITEM_STATUSES.find((value) => value === readText(formData, "expectedStatus"));
  const target = ITEM_STATUSES.find((value) => value === readText(formData, "toStatus"));
  const detail = (notice?: string) => ({
    pathname: `/admin/orders/${orderId}`,
    query: notice ? { notice } : {},
  });

  // TEMPORARY rule until step 4 (canTransition): only the next step, or cancel.
  if (!expected || !target || !canQuickChange(expected, target)) {
    redirect({ href: detail(), locale });
    return;
  }

  const result = await changeItemStatus({
    itemId,
    expectedStatus: expected,
    toStatus: target,
    kind: "normal",
  });

  if (result === "not_found") {
    redirect({ href: "/admin/orders", locale });
    return;
  }
  redirect({ href: detail(result === "conflict" ? "conflict" : "status"), locale });
}

export type AddItemErrorKey = "nameRequired" | "itemInvalid" | "tooLong" | "priceInvalid";

export type AddItemState = {
  errors: Partial<Record<"item" | "price" | "rack" | "note", AddItemErrorKey>>;
  /** What the user typed, so the form keeps it after an error. */
  values: { priceListItemId: string; customName: string; price: string; rack: string; note: string };
};

/** Adds a garment to an order: from the price list, or typed by hand. */
export async function addItemAction(
  _previousState: AddItemState,
  formData: FormData,
): Promise<AddItemState> {
  await requireAdmin();
  const locale = await getLocale();

  const orderId = readText(formData, "orderId");
  const values = {
    priceListItemId: readText(formData, "priceListItemId"),
    customName: readText(formData, "customName"),
    price: readText(formData, "price"),
    rack: readText(formData, "rack"),
    note: readText(formData, "note"),
  };

  const rack = validateOptionalText(values.rack, LIMITS.rackLocation);
  const note = validateOptionalText(values.note, LIMITS.itemNote);
  const errors: AddItemState["errors"] = { rack: rack.error, note: note.error };

  let garmentName: string | null = null;
  let listPriceKurus: number | null = null;
  let priceListItemId: string | null = null;

  if (values.priceListItemId) {
    // The name and the default price come from the database, not from the form.
    const listItem = await getPriceListItem(values.priceListItemId);
    if (!listItem || !listItem.isActive) {
      errors.item = "itemInvalid";
    } else {
      garmentName = listItem.name;
      listPriceKurus = listItem.priceKurus;
      priceListItemId = listItem.id;
    }
  } else if (!values.customName) {
    errors.item = "nameRequired";
  } else if (values.customName.length > LIMITS.garmentName) {
    errors.item = "tooLong";
  } else {
    garmentName = values.customName;
  }

  // The same garment type is not always the same price: a typed price wins over the list price.
  const price = resolveItemPrice(values.price, listPriceKurus);
  if (price.error) errors.price = price.error;
  const unitPriceKurus = price.value ?? null;

  if (Object.values(errors).some(Boolean) || garmentName === null) {
    return { errors, values };
  }

  const item = await addOrderItem({
    orderId,
    garmentName,
    priceListItemId,
    unitPriceKurus,
    rackLocation: rack.value ?? null,
    note: note.value ?? null,
  });
  if (!item) {
    redirect({ href: "/admin/orders", locale });
    return { errors: {}, values };
  }

  redirect({
    href: { pathname: `/admin/orders/${orderId}`, query: { notice: "itemAdded" } },
    locale,
  });
  return { errors: {}, values };
}
