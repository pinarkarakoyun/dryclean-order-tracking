// Values derived from stored data (spec §6). Pure functions, tested with node:test.
// Only type imports from "@/..." here: Node removes them, so the tests run without a bundler.
import type {
  ItemStatus,
  OrderItem,
  OrderStatusSummary,
  OrderTotal,
} from "@/types/order-model";

/** Tag number written on the shop's paper tag, e.g. "1048-1". Not stored: built from its two parts. */
export function tagLabel(orderNumber: number, itemNo: number): string {
  return `${orderNumber}-${itemNo}`;
}

const TAG_PATTERN = /^\s*(\d+)\s*-\s*(\d+)\s*$/;

/** Reads a typed tag number ("1048-1", " 1048 - 1 "), or null if it is not one. */
export function parseTagLabel(input: string): { orderNumber: number; itemNo: number } | null {
  const match = TAG_PATTERN.exec(input);
  if (!match) return null;
  const orderNumber = Number(match[1]);
  const itemNo = Number(match[2]);
  return orderNumber > 0 && itemNo > 0 ? { orderNumber, itemNo } : null;
}

/** Progress order of the non-cancelled statuses: a lower index means further behind. */
const PROGRESS: ItemStatus[] = ["RECEIVED", "CLEANING", "IRONING", "READY", "DELIVERED"];

/** The order status, derived from its items. The first matching rule wins (spec §6). */
export function deriveOrderStatus(items: Pick<OrderItem, "status">[]): OrderStatusSummary {
  if (items.length === 0) {
    return { status: "RECEIVED", noItems: true, partiallyDelivered: false };
  }

  const active = items.filter((item) => item.status !== "CANCELLED");
  if (active.length === 0) {
    return { status: "CANCELLED", noItems: false, partiallyDelivered: false };
  }

  const delivered = active.filter((item) => item.status === "DELIVERED").length;
  if (delivered === active.length) {
    return { status: "DELIVERED", noItems: false, partiallyDelivered: false };
  }
  if (active.every((item) => item.status === "READY" || item.status === "DELIVERED")) {
    return { status: "READY", noItems: false, partiallyDelivered: delivered > 0 };
  }

  const behind = Math.min(...active.map((item) => PROGRESS.indexOf(item.status)));
  return { status: PROGRESS[behind], noItems: false, partiallyDelivered: false };
}

/**
 * The status history as the customer sees it: an undone change and the undo itself are left out,
 * so a wrong click never shows up as "Teslim edildi → Teslim alındı". Step backs stay (real changes).
 * Events must be oldest first. The admin panel keeps showing every event.
 */
export function customerTimeline(
  events: { toStatus: ItemStatus; kind: "normal" | "undo" | "step_back"; changedAt: string }[],
): { status: ItemStatus; changedAt: string }[] {
  const shown: { status: ItemStatus; changedAt: string }[] = [];
  for (const event of events) {
    if (event.kind === "undo") {
      // An undo reverses the change right before it: drop that one, and do not show the undo.
      shown.pop();
    } else {
      shown.push({ status: event.toStatus, changedAt: event.changedAt });
    }
  }
  return shown;
}

/**
 * Order total in kuruş. Cancelled items do not count; a missing price on an active item
 * makes the total "incomplete". Integer math only, rounded half up to the nearest kuruş.
 */
export function calculateOrderTotal(
  items: Pick<OrderItem, "status" | "unitPriceKurus">[],
  expressPercent: number | null,
): OrderTotal {
  let subtotal = 0;
  for (const item of items) {
    if (item.status === "CANCELLED") continue;
    if (item.unitPriceKurus === null) return { kind: "incomplete" };
    subtotal += item.unitPriceKurus;
  }
  const kurus = Math.floor((subtotal * (100 + (expressPercent ?? 0)) + 50) / 100);
  return { kind: "complete", kurus };
}
