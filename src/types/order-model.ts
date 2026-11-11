// Order data model for the dry-cleaning shop (spec: docs/superpowers/specs/2026-11-09-data-model-design.md).
// Tracking happens per garment (OrderItem); the order status is derived from its items.

/** Item statuses in their normal order. CANCELLED can be reached from any open status. */
export const ITEM_STATUSES = [
  "RECEIVED",
  "CLEANING",
  "IRONING",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** Why a status changed: a normal step, the 8-second undo, or "move back one step". */
export const STATUS_EVENT_KINDS = ["normal", "undo", "step_back"] as const;

export type StatusEventKind = (typeof STATUS_EVENT_KINDS)[number];

/** One phone number is one customer. */
export type Customer = {
  id: string;
  name: string;
  /** International (E.164) format, e.g. "+905321234567". Unique. */
  phone: string;
  /** Owner only, e.g. "no starch". Never shown publicly. */
  preferenceNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  /** Internal id (UUID), used in admin URLs. */
  id: string;
  /** Human-friendly number from a database sequence, e.g. 1048. Never used for public lookup. */
  orderNumber: number;
  /** Secret random token for the public tracking URL /track/<token>. */
  trackingToken: string;
  customerId: string;
  /** null = normal order; otherwise the express surcharge copied at the time (e.g. 50). */
  expressPercent: number | null;
  /** Date only, "YYYY-MM-DD". */
  estimatedReadyDate: string | null;
  /** Short text the customer may see on the tracking page. */
  publicDescription: string | null;
  /** Owner only. Never shown publicly. */
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
};

/** One physical garment. Its tag label is "<orderNumber>-<itemNo>", e.g. "1048-1". */
export type OrderItem = {
  id: string;
  orderId: string;
  itemNo: number;
  /** null for "Other" (typed by hand). */
  priceListItemId: string | null;
  /** Copied from the price list, or typed by hand. */
  garmentName: string;
  /** Copied from the price list (kuruş), so later price changes do not affect this order. */
  unitPriceKurus: number | null;
  rackLocation: string | null;
  /** Owner only. Never shown publicly. */
  note: string | null;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
};

/** Append-only status history entry. */
export type ItemStatusEvent = {
  id: number;
  itemId: string;
  /** null for the first event of an item. */
  fromStatus: ItemStatus | null;
  toStatus: ItemStatus;
  kind: StatusEventKind;
  changedAt: string;
};

/** A garment type to pick when adding an item. Hidden products have isActive false. */
export type Product = {
  id: string;
  name: string;
  isActive: boolean;
};

export type OrderWithDetails = Order & { customer: Customer; items: OrderItem[] };

/** The order status, derived from its items (see deriveOrderStatus). */
export type OrderStatusSummary = {
  status: ItemStatus;
  /** True when no item has been added yet. */
  noItems: boolean;
  /** True when the order is READY but some items were already picked up. */
  partiallyDelivered: boolean;
};

/** "incomplete" when an active item has no price: a partial sum must not look final. */
export type OrderTotal = { kind: "complete"; kurus: number } | { kind: "incomplete" };

/** Fields worth completing later. */
export type MissingField = "items" | "price" | "estimatedReadyDate";

/**
 * The ONLY order data that may be shown on the public tracking page (spec §11).
 * No phone, last name, prices, rack location, notes or photos.
 */
export type PublicOrder = {
  orderNumber: number;
  /** First name only. */
  firstName: string;
  publicDescription: string | null;
  estimatedReadyDate: string | null;
  summary: OrderStatusSummary;
  items: {
    label: string;
    garmentName: string;
    status: ItemStatus;
    timeline: { status: ItemStatus; changedAt: string }[];
  }[];
};
