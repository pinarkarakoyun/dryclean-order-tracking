"use server";

import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { readText } from "@/lib/order-validation";
import {
  duplicateErrorKey,
  validateProductName,
  type ProductNameErrorKey,
} from "@/lib/product-validation";
import { createProduct, renameProduct, setProductActive } from "@/lib/products";
import { validateQuickPrice, type QuickPriceErrorKey } from "@/lib/quick-price-validation";
import { addQuickPrice, deleteQuickPrice, listQuickPrices } from "@/lib/quick-prices";

export type ProductFormState = {
  error: ProductNameErrorKey | null;
  /** What the user typed, so the form keeps it after an error. */
  value: string;
};

/** Adds a product from the products page. */
export async function addProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const locale = await getLocale();
  const value = readText(formData, "name");

  const validated = validateProductName(value);
  if ("error" in validated) return { error: validated.error, value };

  const result = await createProduct(validated.value);
  if (!result.ok) {
    return { error: "duplicate" in result ? duplicateErrorKey(result.duplicate, "add") : null, value };
  }

  redirect({ href: { pathname: "/admin/products", query: { notice: "productAdded" } }, locale });
  return { error: null, value: "" };
}

/** Renames a product, then returns to the products page. */
export async function renameProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const locale = await getLocale();
  const productId = readText(formData, "productId");
  const value = readText(formData, "name");

  const validated = validateProductName(value);
  if ("error" in validated) return { error: validated.error, value };

  const result = await renameProduct(productId, validated.value);
  if (!result.ok) {
    if ("notFound" in result) notFound();
    return { error: duplicateErrorKey(result.duplicate, "rename"), value };
  }

  redirect({ href: { pathname: "/admin/products", query: { notice: "productRenamed" } }, locale });
  return { error: null, value };
}

/** Hide or restore: one tap, no confirmation (it can be undone from the same page). */
async function changeVisibility(formData: FormData, isActive: boolean) {
  await requireAdmin();
  const locale = await getLocale();
  const productId = readText(formData, "productId");

  const found = await setProductActive(productId, isActive);
  redirect({
    href: found
      ? {
          pathname: "/admin/products",
          query: { notice: isActive ? "productRestored" : "productHidden", id: productId },
        }
      : "/admin/products",
    locale,
  });
}

export async function hideProductAction(formData: FormData): Promise<void> {
  await changeVisibility(formData, false);
}

export async function restoreProductAction(formData: FormData): Promise<void> {
  await changeVisibility(formData, true);
}

export type QuickPriceFormState = {
  error: QuickPriceErrorKey | null;
  /** What the user typed, so the form keeps it after an error. */
  value: string;
};

/** Adds a quick price. The limit and duplicates are checked against a fresh server read. */
export async function addQuickPriceAction(
  _previousState: QuickPriceFormState,
  formData: FormData,
): Promise<QuickPriceFormState> {
  await requireAdmin();
  const locale = await getLocale();
  const value = readText(formData, "amount");

  const validated = validateQuickPrice(value, await listQuickPrices());
  if ("error" in validated) return { error: validated.error, value };

  const result = await addQuickPrice(validated.value);
  if (!result.ok) return { error: "duplicate", value };

  redirect({ href: { pathname: "/admin/products", query: { notice: "priceAdded" } }, locale });
  return { error: null, value: "" };
}

/** Deletes a quick price: one tap, no confirmation (it can simply be added again). */
export async function deleteQuickPriceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const locale = await getLocale();
  // A stale tab may delete a price that is already gone: then no notice (nothing happened).
  const deleted = await deleteQuickPrice(readText(formData, "quickPriceId"));
  redirect({
    href: deleted ? { pathname: "/admin/products", query: { notice: "priceDeleted" } } : "/admin/products",
    locale,
  });
}
