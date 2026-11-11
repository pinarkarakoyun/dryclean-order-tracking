import type { ItemStatus, MissingField, OrderWithDetails } from "@/types/order-model";
import { deriveOrderStatus } from "./order-calc";

const SHOP_TIME_ZONE = "Europe/Istanbul";

/** Today's date in the shop's time zone, as "YYYY-MM-DD". */
export function todayInShop(now: Date = new Date()): string {
  // The "en-CA" locale happens to format dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE }).format(now);
}

/** Turns a "YYYY-MM-DD" string into a Date (noon UTC, so it never shifts to another day). */
export function dateOnlyToDate(dateOnly: string): Date {
  return new Date(`${dateOnly}T12:00:00Z`);
}

/** Still being worked on: not ready, picked up or cancelled. */
export function isOpen(status: ItemStatus): boolean {
  return status === "RECEIVED" || status === "CLEANING" || status === "IRONING";
}

/** Fields worth completing later. Only relevant for orders that are not finished. */
export function getMissingFields(order: OrderWithDetails): MissingField[] {
  const { status, noItems } = deriveOrderStatus(order.items);
  if (status === "DELIVERED" || status === "CANCELLED") return [];

  const missing: MissingField[] = [];
  if (noItems) missing.push("items");
  if (order.items.some((item) => item.status !== "CANCELLED" && item.unitPriceKurus === null)) {
    missing.push("price");
  }
  if (order.estimatedReadyDate === null) missing.push("estimatedReadyDate");
  return missing;
}

export type DueState = "overdue" | "dueToday" | null;

/** Whether an open order is late or due today. Date strings compare correctly as text. */
export function getDueState(order: OrderWithDetails, today: string): DueState {
  if (!isOpen(deriveOrderStatus(order.items).status) || order.estimatedReadyDate === null) {
    return null;
  }
  if (order.estimatedReadyDate < today) return "overdue";
  if (order.estimatedReadyDate === today) return "dueToday";
  return null;
}
