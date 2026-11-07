import type { MissingField, Order, OrderStatus } from "@/types/order";

const SHOP_TIME_ZONE = "Europe/Amsterdam";

/** Today's date in the shop's time zone, as "YYYY-MM-DD". */
export function todayInShop(now: Date = new Date()): string {
  // The "en-CA" locale happens to format dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE }).format(
    now,
  );
}

/** Turns a "YYYY-MM-DD" string into a Date (noon UTC, so it never shifts to another day). */
export function dateOnlyToDate(dateOnly: string): Date {
  return new Date(`${dateOnly}T12:00:00Z`);
}

/** Statuses that can be a "next step" (each has its own button text). */
export type NextStatus = "IN_PROGRESS" | "READY_FOR_PICKUP" | "DELIVERED";

/** The usual next step in the workflow, or null when the order is finished. */
export function getNextStatus(status: OrderStatus): NextStatus | null {
  switch (status) {
    case "RECEIVED":
      return "IN_PROGRESS";
    case "IN_PROGRESS":
      return "READY_FOR_PICKUP";
    case "READY_FOR_PICKUP":
      return "DELIVERED";
    default:
      return null;
  }
}

/** Orders that are still being worked on (not ready, picked up or cancelled). */
export function isOpen(status: OrderStatus): boolean {
  return status === "RECEIVED" || status === "IN_PROGRESS";
}

/** Fields worth completing later. Only relevant for orders that are not finished. */
export function getMissingFields(order: Order): MissingField[] {
  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    return [];
  }
  const missing: MissingField[] = [];
  if (order.serviceId === null) missing.push("service");
  if (order.priceCents === null) missing.push("price");
  if (order.estimatedReadyDate === null) missing.push("estimatedReadyDate");
  return missing;
}

export type DueState = "overdue" | "dueToday" | null;

/** Whether an open order is late or due today. Date strings compare correctly as text. */
export function getDueState(order: Order, today: string): DueState {
  if (!isOpen(order.status) || order.estimatedReadyDate === null) {
    return null;
  }
  if (order.estimatedReadyDate < today) return "overdue";
  if (order.estimatedReadyDate === today) return "dueToday";
  return null;
}
