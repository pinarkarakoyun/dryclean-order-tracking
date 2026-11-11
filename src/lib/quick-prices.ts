import { connection } from "next/server";
import type { QuickPrice } from "@/types/order-model";
import { getDb } from "./db";
import { isUuid } from "./ids";
import { sortQuickPrices } from "./quick-price-validation";

// Quick price buttons of the item form, edited in the panel. No order links to them,
// so deleting one is a real delete and changes nothing in existing orders.

type QuickPriceRow = { id: string; amount_kurus: number };

const UNIQUE_VIOLATION = "23505";

/** All quick prices, low to high. */
export async function listQuickPrices(): Promise<QuickPrice[]> {
  await connection();
  const { data, error } = await getDb()
    .from("quick_prices")
    .select("id, amount_kurus")
    .returns<QuickPriceRow[]>();
  if (error) throw new Error(`Database error (quick prices): ${error.message}`);
  return sortQuickPrices(data.map((row) => ({ id: row.id, amountKurus: row.amount_kurus })));
}

/**
 * Adds an amount already checked by validateQuickPrice (incl. the limit of 8).
 * Two tabs adding the same amount at once: the unique rule in the database refuses the second.
 */
export async function addQuickPrice(
  amountKurus: number,
): Promise<{ ok: true } | { ok: false; reason: "duplicate" }> {
  await connection();
  const { error } = await getDb().from("quick_prices").insert({ amount_kurus: amountKurus });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { ok: false, reason: "duplicate" };
    throw new Error(`Database error (quick prices): ${error.message}`);
  }
  return { ok: true };
}

/** Deletes one quick price. An invalid id or a missing row is not an error. */
export async function deleteQuickPrice(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await connection();
  const { error } = await getDb().from("quick_prices").delete().eq("id", id);
  if (error) throw new Error(`Database error (quick prices): ${error.message}`);
}
