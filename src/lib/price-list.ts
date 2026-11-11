import { connection } from "next/server";
import type { PriceListItem } from "@/types/order-model";
import { getDb } from "./db";
import { isUuid } from "./ids";

// Price list data access. Editing the list in the panel comes in roadmap step 5.

type PriceListRow = {
  id: string;
  name: string;
  price_kurus: number;
  is_active: boolean;
  sort_order: number;
};

function toPriceListItem(row: PriceListRow): PriceListItem {
  return {
    id: row.id,
    name: row.name,
    priceKurus: row.price_kurus,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

/** Active items, in list order, then by name. */
export async function listActivePriceListItems(): Promise<PriceListItem[]> {
  await connection();
  const { data, error } = await getDb()
    .from("price_list_items")
    .select("id, name, price_kurus, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order")
    .order("name")
    .returns<PriceListRow[]>();
  if (error) throw new Error(`Database error (price list): ${error.message}`);
  return data.map(toPriceListItem);
}

/** One item (active or not), or null. Used to copy the name and price onto a new order item. */
export async function getPriceListItem(id: string): Promise<PriceListItem | null> {
  if (!isUuid(id)) return null;
  await connection();
  const { data, error } = await getDb()
    .from("price_list_items")
    .select("id, name, price_kurus, is_active, sort_order")
    .eq("id", id)
    .maybeSingle<PriceListRow>();
  if (error) throw new Error(`Database error (price list): ${error.message}`);
  return data ? toPriceListItem(data) : null;
}
