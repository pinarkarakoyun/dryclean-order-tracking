// Status rules for one garment.
// Roadmap step 4: Pınar writes canTransition(from, to, kind) here, and it replaces canQuickChange.
import type { ItemStatus } from "@/types/order-model";

/** Statuses that can be a "next step" (each has its own button text). */
export type NextItemStatus = "CLEANING" | "IRONING" | "READY" | "DELIVERED";

/** The usual next step, or null when the item is finished (DELIVERED) or CANCELLED. */
export function getNextItemStatus(status: ItemStatus): NextItemStatus | null {
  switch (status) {
    case "RECEIVED":
      return "CLEANING";
    case "CLEANING":
      return "IRONING";
    case "IRONING":
      return "READY";
    case "READY":
      return "DELIVERED";
    default:
      return null;
  }
}

/**
 * TEMPORARY rule until step 4: only the next step, or cancelling an item that is not finished.
 * No going back yet, so a wrong click cannot be undone in the app until step 4.
 */
export function canQuickChange(from: ItemStatus, to: ItemStatus): boolean {
  if (to === getNextItemStatus(from)) return true;
  return to === "CANCELLED" && from !== "DELIVERED" && from !== "CANCELLED";
}
