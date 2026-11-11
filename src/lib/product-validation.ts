// Product name rules: validation, duplicates and order. Pure functions, tested with node:test.
import type { Product } from "@/types/order-model";
import { LIMITS } from "./order-limits.ts";
import { normalizeSearchText } from "./text-search.ts";

export type ProductNameErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "duplicateActive"
  | "duplicateHidden"
  | "duplicateHiddenRename";

/** " Takım   elbise " -> "Takım elbise": outer spaces go, inner spaces become one. */
function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Comparison key: "GÖMLEK", "gomlek" and " Gömlek " are the same product. */
function nameKey(name: string): string {
  return normalizeSearchText(cleanName(name));
}

export function validateProductName(
  raw: string,
): { value: string } | { error: "nameRequired" | "nameTooLong" } {
  const name = cleanName(raw);
  if (!name) return { error: "nameRequired" };
  if (name.length > LIMITS.garmentName) return { error: "nameTooLong" };
  return { value: name };
}

/**
 * The product that already has this name, visible or hidden, or null.
 * `ignoreId` skips the product being renamed, so "gömlek" -> "Gömlek" is allowed.
 */
export function findDuplicateProduct(
  products: Product[],
  name: string,
  ignoreId?: string,
): { kind: "active" | "hidden"; id: string } | null {
  const key = nameKey(name);
  const match = products.find((product) => product.id !== ignoreId && nameKey(product.name) === key);
  if (!match) return null;
  return { kind: match.isActive ? "active" : "hidden", id: match.id };
}

/**
 * The message for a duplicate name. The products page shows the hidden list below the form;
 * the rename page does not, so it points to the products page instead.
 */
export function duplicateErrorKey(
  kind: "active" | "hidden",
  page: "add" | "rename",
): ProductNameErrorKey {
  if (kind === "active") return "duplicateActive";
  return page === "add" ? "duplicateHidden" : "duplicateHiddenRename";
}

/** Turkish alphabetical order ("Ceket" < "Çanta" < "Dikiş"), ties by id; returns a new array. */
export function sortProducts(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => a.name.localeCompare(b.name, "tr") || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
