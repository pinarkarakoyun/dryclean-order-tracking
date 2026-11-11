// Status rules for one garment. Pure functions, tested with node:test.
import type { ItemStatus, ItemStatusEvent, StatusEventKind } from "@/types/order-model";

/** The normal progress of a garment. CANCELLED is outside this line. */
export const PROGRESS: readonly ItemStatus[] = [
  "RECEIVED",
  "CLEANING",
  "IRONING",
  "READY",
  "DELIVERED",
];

/** Position in PROGRESS (RECEIVED = 0 … DELIVERED = 4), or -1 for CANCELLED. */
export function progressIndex(status: ItemStatus): number {
  return PROGRESS.indexOf(status);
}

/** Statuses that can be a "next step" (each has its own button text). */
export type NextItemStatus = "CLEANING" | "IRONING" | "READY" | "DELIVERED";

/** The usual next step, or null when the item is finished (DELIVERED) or CANCELLED. */
export function getNextItemStatus(status: ItemStatus): NextItemStatus | null {
  const index = progressIndex(status);
  if (index < 0 || index === PROGRESS.length - 1) return null;
  return PROGRESS[index + 1] as NextItemStatus;
}

/** The stage before this one ("move back one step"), or null for RECEIVED and CANCELLED. */
export function getPreviousItemStatus(status: ItemStatus): ItemStatus | null {
  const index = progressIndex(status);
  return index > 0 ? PROGRESS[index - 1] : null;
}

/**
 * Where "Undo" (Geri al) takes the item: back to where its LATEST change came from.
 * Null when there is nothing to undo: no event, the item changed again since,
 * the latest event is the item being added, or it is already an undo (no undo of an undo).
 * The server checks this with the real latest event before writing (spec: append-only, undo adds a new event).
 */
export function getUndoTarget(
  latest: ItemStatusEvent | null,
  currentStatus: ItemStatus,
): ItemStatus | null {
  if (!latest || latest.kind === "undo" || latest.fromStatus === null) return null;
  if (latest.toStatus !== currentStatus) return null;
  return latest.fromStatus;
}

/**
 * May an item go from `from` to `to` with this `kind`? (roadmap step 4, rules decided by Pınar)
 * - "normal":    forward, skipping steps is allowed; an open item can be cancelled;
 *                a cancelled item is brought back to RECEIVED.
 * - "step_back": exactly one stage back ("Önceki aşamaya al"), DELIVERED → READY included.
 * - "undo":      never decided here: the server uses getUndoTarget() (latest change only).
 * Both the buttons and the server ask this function, so changing a rule here changes both.
 * The rules are pinned by the tests in item-status.test.ts.
 */
export function canTransition(from: ItemStatus, to: ItemStatus, kind: StatusEventKind): boolean {
  if (from === to) return false;

  switch (kind) {
    case "normal":
      // A delivered garment is with the customer: it can be moved back, not cancelled.
      if (to === "CANCELLED") return from !== "DELIVERED";
      // Bringing back a cancelled item starts it again, like a newly received garment.
      if (from === "CANCELLED") return to === "RECEIVED";
      // Forward only; skipping a step (e.g. no ironing needed) is fine.
      return progressIndex(to) > progressIndex(from);
    case "step_back":
      return to === getPreviousItemStatus(from);
    case "undo":
      return false;
  }
}
