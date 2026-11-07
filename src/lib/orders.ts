import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import type { Locale } from "@/i18n/routing";
import type { Order, OrderStatus, PublicOrder, StatusChange } from "@/types/order";
import { createSeedData } from "./mock-data";
import { generateTrackingToken } from "./token";

// THE single place for order data access.
// Prototype: data lives in server memory and resets when the server restarts.
// Later, only the inside of this file changes to use a real database (Supabase/PostgreSQL).

type Store = {
  orders: Order[];
  statusChanges: StatusChange[];
};

// Kept on globalThis so it survives hot reloads in development.
const globalForStore = globalThis as unknown as { mustanStore?: Store };

async function getStore(): Promise<Store> {
  // Mock data can change at any time, so tell Next.js to read it on every
  // request instead of baking it into a pre-rendered page.
  await connection();
  globalForStore.mustanStore ??= createSeedData(new Date());
  return globalForStore.mustanStore;
}

/** All orders, newest first. Returns copies, like a database would. */
export async function listOrders(): Promise<Order[]> {
  const store = await getStore();
  return structuredClone(store.orders).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export type OrderSearch = {
  /** Free text: customer name, phone number or order number. */
  query?: string;
  status?: OrderStatus;
};

/** Orders matching the search, newest first. (With a database this becomes a SQL query.) */
export async function searchOrders({
  query = "",
  status,
}: OrderSearch): Promise<Order[]> {
  const orders = await listOrders();
  const text = normalizeText(query.trim());
  // "06 1234 0005", "+31612340005" and "0612340005" should all find the same phone.
  const digits = query.replace(/\D/g, "").replace(/^0+/, "");

  return orders.filter((order) => {
    if (status && order.status !== status) return false;
    if (!text) return true;
    return (
      normalizeText(order.customerName).includes(text) ||
      (digits.length > 0 && String(order.orderNumber).includes(digits)) ||
      (digits.length >= 4 && order.customerPhone.replace(/\D/g, "").includes(digits))
    );
  });
}

/** Lowercase without accents, so "yilmaz" finds "Yılmaz" and "celik" finds "Çelik". */
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i");
}

/** One order with its status history (oldest first), or null if it does not exist. */
export async function getOrderWithHistory(
  id: string,
): Promise<{ order: Order; history: StatusChange[] } | null> {
  const store = await getStore();
  const order = store.orders.find((candidate) => candidate.id === id);
  if (!order) return null;

  const history = store.statusChanges
    .filter((change) => change.orderId === id)
    .sort((a, b) => a.changedAt.localeCompare(b.changedAt));
  return structuredClone({ order, history });
}

export type NewOrderInput = {
  customerName: string;
  /** Already validated and normalized (E.164). */
  customerPhone: string;
  customerLanguage: Locale;
};

/** Creates an order with only the required fields. Everything else can be added later. */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  const store = await getStore();
  const now = new Date().toISOString();
  // With a database, the number would come from a sequence to avoid duplicates.
  const lastNumber = Math.max(0, ...store.orders.map((order) => order.orderNumber));

  const order: Order = {
    id: randomUUID(),
    orderNumber: lastNumber + 1,
    trackingToken: generateTrackingToken(),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerLanguage: input.customerLanguage,
    serviceId: null,
    clothingType: null,
    publicDescription: null,
    internalNote: null,
    priceCents: null,
    estimatedReadyDate: null,
    status: "RECEIVED",
    createdAt: now,
    updatedAt: now,
  };

  store.orders.push(order);
  // The first history entry: every order starts as RECEIVED.
  store.statusChanges.push({
    id: randomUUID(),
    orderId: order.id,
    status: "RECEIVED",
    changedAt: now,
  });
  return structuredClone(order);
}

/** Fields the owner can change on the edit page (status has its own function). */
export type OrderUpdate = Pick<
  Order,
  | "customerName"
  | "customerPhone"
  | "customerLanguage"
  | "serviceId"
  | "clothingType"
  | "publicDescription"
  | "internalNote"
  | "priceCents"
  | "estimatedReadyDate"
>;

/** Saves edited fields. Input must already be validated. Returns null if the order does not exist. */
export async function updateOrder(
  id: string,
  update: OrderUpdate,
): Promise<Order | null> {
  const store = await getStore();
  const order = store.orders.find((candidate) => candidate.id === id);
  if (!order) return null;

  Object.assign(order, update, { updatedAt: new Date().toISOString() });
  return structuredClone(order);
}

/**
 * Changes the status and records it in the history.
 * Setting the same status again does nothing (e.g. after a double click).
 */
export async function changeOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  const store = await getStore();
  const order = store.orders.find((candidate) => candidate.id === id);
  if (!order) return null;
  if (order.status === status) return structuredClone(order);

  const now = new Date().toISOString();
  // With a database, these two writes would happen in one transaction.
  order.status = status;
  order.updatedAt = now;
  store.statusChanges.push({ id: randomUUID(), orderId: id, status, changedAt: now });
  return structuredClone(order);
}

// Tokens are base64url (see token.ts); demo tokens have a "demo-" prefix.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

/**
 * Public view of an order for /track/<token>, or null if the token is unknown.
 * Builds a new object with only the allowed fields, so private data can never
 * reach the public page by accident (privacy by design).
 */
export async function getPublicOrderByToken(token: string): Promise<PublicOrder | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const store = await getStore();
  const order = store.orders.find((candidate) => candidate.trackingToken === token);
  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    firstName: order.customerName.split(/\s+/)[0],
    serviceId: order.serviceId,
    publicDescription: order.publicDescription,
    status: order.status,
    estimatedReadyDate: order.estimatedReadyDate,
    timeline: store.statusChanges
      .filter((change) => change.orderId === order.id)
      .sort((a, b) => a.changedAt.localeCompare(b.changedAt))
      .map(({ status, changedAt }) => ({ status, changedAt })),
  };
}
