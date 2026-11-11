import { connection } from "next/server";
import type { Product } from "@/types/order-model";
import { getDb } from "./db";
import { isUuid } from "./ids";

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
