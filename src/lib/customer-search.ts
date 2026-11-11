// Customer list: order stats, search and sort. Pure functions, tested with node:test.
import type { Customer } from "@/types/order-model";
import { normalizeSearchText, phoneSearchDigits } from "./text-search.ts";

export type CustomerListEntry = Customer & {
  orderCount: number;
  /** created_at of the customer's newest order, or null without orders. */
  lastOrderAt: string | null;
};

/** Phone search starts at 3 digits, so "05" does not match every number. */
const MIN_PHONE_DIGITS = 3;

/** Adds the order count and last order date to each customer (same order as `customers`). */
export function withOrderStats(
  customers: Customer[],
  orders: { customerId: string; createdAt: string }[],
): CustomerListEntry[] {
  const stats = new Map<string, { count: number; last: string }>();
  for (const order of orders) {
    const current = stats.get(order.customerId);
    if (!current) {
      stats.set(order.customerId, { count: 1, last: order.createdAt });
    } else {
      current.count += 1;
      if (Date.parse(order.createdAt) > Date.parse(current.last)) current.last = order.createdAt;
    }
  }
  return customers.map((customer) => {
    const entry = stats.get(customer.id);
    return { ...customer, orderCount: entry?.count ?? 0, lastOrderAt: entry?.last ?? null };
  });
}

/** Customers whose name or phone contains the search text. Empty text returns the list as is. */
export function filterCustomers(list: CustomerListEntry[], query: string): CustomerListEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return list;
  const text = normalizeSearchText(trimmed);
  const digits = phoneSearchDigits(trimmed);
  return list.filter(
    (customer) =>
      normalizeSearchText(customer.name).includes(text) ||
      (digits.length >= MIN_PHONE_DIGITS && customer.phone.replace(/\D/g, "").includes(digits)),
  );
}

/**
 * Newest order first; customers without orders last, newest customer first among them.
 * Ties by name (Turkish alphabet), then id, so the order never jumps between page loads.
 */
export function sortCustomers(list: CustomerListEntry[]): CustomerListEntry[] {
  return [...list].sort((a, b) => {
    if (a.lastOrderAt !== b.lastOrderAt) {
      if (a.lastOrderAt === null) return 1;
      if (b.lastOrderAt === null) return -1;
      const byOrder = Date.parse(b.lastOrderAt) - Date.parse(a.lastOrderAt);
      if (byOrder !== 0) return byOrder;
    }
    if (a.lastOrderAt === null) {
      const byCreated = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (byCreated !== 0) return byCreated;
    }
    return a.name.localeCompare(b.name, "tr") || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
}
