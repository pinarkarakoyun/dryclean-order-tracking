import type { Locale } from "@/i18n/routing";

/** The only allowed statuses, in their normal order. */
export const ORDER_STATUSES = [
  "RECEIVED",
  "IN_PROGRESS",
  "READY_FOR_PICKUP",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  /** Internal id (UUID), used in admin URLs. */
  id: string;
  /** Human-friendly number for receipts and garment tags, e.g. 1048. Never used for public lookup. */
  orderNumber: number;
  /** Secret random token for the public tracking URL /track/<token>. */
  trackingToken: string;

  // Required at creation
  customerName: string;
  /** International (E.164) format, e.g. "+31612345678". */
  customerPhone: string;
  /** Language for WhatsApp messages and the tracking link. */
  customerLanguage: Locale;

  // Optional, can be filled in later
  serviceId: string | null;
  clothingType: string | null;
  /** Short text the customer may see on the tracking page. */
  publicDescription: string | null;
  /** Owner only: instructions, measurements. Never shown publicly. */
  internalNote: string | null;
  /** Price in cents (integer). */
  priceCents: number | null;
  /** Date only, "YYYY-MM-DD". */
  estimatedReadyDate: string | null;

  /** Current status (also recorded in the status history). */
  status: OrderStatus;
  /** ISO date-time strings. */
  createdAt: string;
  updatedAt: string;
};

/** One entry in an order's status history. */
export type StatusChange = {
  id: string;
  orderId: string;
  status: OrderStatus;
  /** ISO date-time string. */
  changedAt: string;
};

/** Optional fields that are important but may be missing on quickly created orders. */
export type MissingField = "service" | "price" | "estimatedReadyDate";

/**
 * The ONLY order data that may be shown on the public tracking page (PRD §8).
 * No phone number, last name, internal note or price.
 */
export type PublicOrder = {
  orderNumber: number;
  /** First name only. */
  firstName: string;
  serviceId: string | null;
  publicDescription: string | null;
  status: OrderStatus;
  estimatedReadyDate: string | null;
  /** Status history without internal ids. */
  timeline: { status: OrderStatus; changedAt: string }[];
};
