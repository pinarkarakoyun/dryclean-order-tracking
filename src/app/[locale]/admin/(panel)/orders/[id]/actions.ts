"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canTransition, getUndoTarget } from "@/lib/item-status";
import { LIMITS } from "@/lib/order-limits";
import {
  readText,
  resolveItemPrice,
  resolveItemSource,
  validateOptionalText,
} from "@/lib/order-validation";
import { addOrderItem, changeItemStatus, getItemForStatusChange } from "@/lib/orders";
import { getPriceListItem } from "@/lib/price-list";
import { ITEM_STATUSES, type ItemStatus } from "@/types/order-model";

/** Reads the fields every status form sends, and checks the item belongs to the order on screen. */
async function readStatusForm(formData: FormData) {
  const orderId = readText(formData, "orderId");
  const itemId = readText(formData, "itemId");
  // Only known statuses are accepted.
  const expected = ITEM_STATUSES.find((value) => value === readText(formData, "expectedStatus"));
  const item = isUuid(orderId) ? await getItemForStatusChange(itemId) : null;
  return { orderId, itemId, expected, item: item && item.orderId === orderId ? item : null };
}

function detailHref(orderId: string, query: Record<string, string> = {}) {
  return { pathname: `/admin/orders/${orderId}`, query };
}

/** The status buttons of one garment: a step forward (or back), cancel, bring back. */
export async function changeItemStatusAction(formData: FormData): Promise<void> {
  // Server Actions are public endpoints: always check the login again here.
  await requireAdmin();
  const locale = await getLocale();

  const { orderId, itemId, expected, item } = await readStatusForm(formData);
  if (!item || !expected) {
    redirect({ href: "/admin/orders", locale });
    return;
  }
  const target = ITEM_STATUSES.find((value) => value === readText(formData, "toStatus"));
  // The form can only ask for these two kinds; undo has its own action below.
  const kind = readText(formData, "kind") === "step_back" ? "step_back" : "normal";

  // Pınar's rules decide which changes are allowed (src/lib/item-status.ts).
  if (!target || !canTransition(expected, target, kind)) {
    redirect({ href: detailHref(orderId), locale });
    return;
  }

  const result = await changeItemStatus({ itemId, expectedStatus: expected, toStatus: target, kind });
  if (result === "not_found") {
    redirect({ href: "/admin/orders", locale });
    return;
  }
  redirect({
    href: detailHref(
      orderId,
      // "changed" lets the page offer "Geri al" for this item for a few seconds.
      result === "conflict" ? { notice: "conflict" } : { notice: "status", changed: itemId },
    ),
    locale,
  });
}

/** "Geri al": reverses the item's latest change by adding a new "undo" event (nothing is deleted). */
export async function undoItemStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const locale = await getLocale();

  const { orderId, itemId, expected, item } = await readStatusForm(formData);
  if (!item || !expected) {
    redirect({ href: "/admin/orders", locale });
    return;
  }

  // A second tap on "Geri al" after the undo went through: nothing more to do.
  if (item.latest?.kind === "undo" && item.latest.fromStatus === expected) {
    redirect({ href: detailHref(orderId, { notice: "undone" }), locale });
    return;
  }

  const target: ItemStatus | null =
    item.status === expected ? getUndoTarget(item.latest, item.status) : null;
  if (!target) {
    redirect({ href: detailHref(orderId, { notice: "conflict" }), locale });
    return;
  }

  const result = await changeItemStatus({
    itemId,
    expectedStatus: expected,
    toStatus: target,
    kind: "undo",
  });
  redirect({
    href: detailHref(orderId, { notice: result === "ok" ? "undone" : "conflict" }),
    locale,
  });
}

export type AddItemErrorKey =
  | "nameRequired"
  | "bothGiven"
  | "itemInvalid"
  | "tooLong"
  | "priceInvalid";

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

  const source = resolveItemSource(values.priceListItemId, values.customName);
  if (source.error) {
    errors.item = source.error;
  } else if (source.value.kind === "list") {
    // The name and the default price come from the database, not from the form.
    const listItem = await getPriceListItem(source.value.id);
    if (!listItem || !listItem.isActive) {
      errors.item = "itemInvalid";
    } else {
      garmentName = listItem.name;
      listPriceKurus = listItem.priceKurus;
      priceListItemId = listItem.id;
    }
  } else {
    garmentName = source.value.name;
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
