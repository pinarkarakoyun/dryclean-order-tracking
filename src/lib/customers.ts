import { connection } from "next/server";
import type { Customer } from "@/types/order-model";
import { getDb } from "./db";

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
