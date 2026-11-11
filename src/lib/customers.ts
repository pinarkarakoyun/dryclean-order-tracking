import { connection } from "next/server";
import type { Customer } from "@/types/order-model";
import { type CustomerListEntry, withOrderStats } from "./customer-search";
import { getDb } from "./db";
import { isUuid } from "./ids";
import { collectAllPages } from "./paging";

// Customer data access. Callers must run requireAdmin() first.

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  preference_note: string | null;
  created_at: string;
  updated_at: string;
};

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    preferenceNote: row.preference_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The customer with this phone (E.164), or null. One phone number is one customer. */
export async function findCustomerByPhone(phone: string): Promise<Customer | null> {
  await connection();
  const { data, error } = await getDb()
    .from("customers")
    .select("*")
    .eq("phone", phone)
    .maybeSingle<CustomerRow>();
  if (error) throw new Error(`Database error (customers): ${error.message}`);
  return data ? toCustomer(data) : null;
}

function fail(message: string): never {
  throw new Error(`Database error (customers): ${message}`);
}

/** All customers with order count and last order date (unsorted: see sortCustomers). */
export async function listCustomers(): Promise<CustomerListEntry[]> {
  await connection();
  const db = getDb();
  const customers = await collectAllPages(async (from, to) => {
    const { data, error } = await db
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to)
      .returns<CustomerRow[]>();
    if (error) fail(error.message);
    return data;
  });
  const orders = await collectAllPages(async (from, to) => {
    const { data, error } = await db
      .from("orders")
      .select("customer_id, created_at")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to)
      .returns<{ customer_id: string; created_at: string }[]>();
    if (error) fail(error.message);
    return data;
  });
  return withOrderStats(
    customers.map(toCustomer),
    orders.map((row) => ({ customerId: row.customer_id, createdAt: row.created_at })),
  );
}

/** One customer, or null for an unknown or malformed id. */
export async function getCustomer(id: string): Promise<Customer | null> {
  await connection();
  if (!isUuid(id)) return null;
  const { data, error } = await getDb()
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle<CustomerRow>();
  if (error) fail(error.message);
  return data ? toCustomer(data) : null;
}

export type UpdateCustomerResult =
  | { ok: true }
  | { ok: false; reason: "phoneTaken"; owner: { id: string; name: string } }
  | { ok: false; reason: "notFound" };

/** Postgres error code for a unique constraint violation (customers.phone). */
const UNIQUE_VIOLATION = "23505";

/**
 * Saves name, phone (E.164) and preference note. One phone number is one customer:
 * a number that belongs to someone else is refused, never moved or merged.
 */
export async function updateCustomer(
  id: string,
  values: { name: string; phone: string; preferenceNote: string | null },
): Promise<UpdateCustomerResult> {
  await connection();
  if (!isUuid(id)) return { ok: false, reason: "notFound" };

  const phoneTaken = async (): Promise<UpdateCustomerResult | null> => {
    const owner = await findCustomerByPhone(values.phone);
    return owner && owner.id !== id
      ? { ok: false, reason: "phoneTaken", owner: { id: owner.id, name: owner.name } }
      : null;
  };

  // Checked first for a friendly message. Keeping their own number is not a conflict.
  const taken = await phoneTaken();
  if (taken) return taken;

  const { data, error } = await getDb()
    .from("customers")
    .update({ name: values.name, phone: values.phone, preference_note: values.preferenceNote })
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (error) {
    // Someone saved the same number between the check and the update: the database decides.
    if (error.code === UNIQUE_VIOLATION) {
      const takenNow = await phoneTaken();
      if (takenNow) return takenNow;
    }
    fail(error.message);
  }
  return data ? { ok: true } : { ok: false, reason: "notFound" };
}
