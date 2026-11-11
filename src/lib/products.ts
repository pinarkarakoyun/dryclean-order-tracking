import { connection } from "next/server";
import type { Product } from "@/types/order-model";
import { getDb } from "./db";
import { isUuid } from "./ids";
import { findDuplicateProduct } from "./product-validation";

// Products: the garment types to pick when adding an item. They have no price: the same
// garment type is not always the same price, so the price is typed per item.
// The table is still called "price_list_items" (and order_items.price_list_item_id points to it):
// renaming it would also change the foreign key and the add_order_item RPC, for no gain.

type ProductRow = {
  id: string;
  name: string;
  is_active: boolean;
};

function toProduct(row: ProductRow): Product {
  return { id: row.id, name: row.name, isActive: row.is_active };
}

/** All products, visible and hidden, unsorted (sortProducts sorts them). A shop has few. */
export async function listProducts(): Promise<Product[]> {
  await connection();
  const { data, error } = await getDb()
    .from("price_list_items")
    .select("id, name, is_active")
    .returns<ProductRow[]>();
  if (error) throw new Error(`Database error (products): ${error.message}`);
  return data.map(toProduct);
}

/** One product (visible or hidden), or null. Used to copy the name onto a new order item. */
export async function getProduct(id: string): Promise<Product | null> {
  if (!isUuid(id)) return null;
  await connection();
  const { data, error } = await getDb()
    .from("price_list_items")
    .select("id, name, is_active")
    .eq("id", id)
    .maybeSingle<ProductRow>();
  if (error) throw new Error(`Database error (products): ${error.message}`);
  return data ? toProduct(data) : null;
}

export type ProductWriteResult =
  | { ok: true }
  | { ok: false; duplicate: "active" | "hidden" }
  | { ok: false; notFound: true };

/** Same name (ignoring case, Turkish letters, spacing) among visible or hidden products. */
async function duplicateOf(name: string, ignoreId?: string): Promise<"active" | "hidden" | null> {
  return findDuplicateProduct(await listProducts(), name, ignoreId)?.kind ?? null;
}

/** Adds a visible product. `name` is already validated (validateProductName). */
export async function createProduct(name: string): Promise<ProductWriteResult> {
  const duplicate = await duplicateOf(name);
  if (duplicate) return { ok: false, duplicate };
  const { error } = await getDb().from("price_list_items").insert({ name });
  if (error) throw new Error(`Database error (products): ${error.message}`);
  return { ok: true };
}

/** Renames a product (visible or hidden). Old order items keep their own copied name. */
export async function renameProduct(id: string, name: string): Promise<ProductWriteResult> {
  if (!isUuid(id)) return { ok: false, notFound: true };
  // The product itself is ignored, so "gömlek" -> "Gömlek" is allowed.
  const duplicate = await duplicateOf(name, id);
  if (duplicate) return { ok: false, duplicate };
  const { data, error } = await getDb()
    .from("price_list_items")
    .update({ name })
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (error) throw new Error(`Database error (products): ${error.message}`);
  return data ? { ok: true } : { ok: false, notFound: true };
}

/** Hides or restores a product. False when it does not exist. Products are never deleted. */
export async function setProductActive(id: string, isActive: boolean): Promise<boolean> {
  if (!isUuid(id)) return false;
  await connection();
  const { data, error } = await getDb()
    .from("price_list_items")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (error) throw new Error(`Database error (products): ${error.message}`);
  return data !== null;
}
