import { connection } from "next/server";
import type {
  ItemStatus,
  ItemStatusEvent,
  Order,
  OrderItem,
  OrderWithDetails,
  PublicOrder,
  StatusEventKind,
} from "@/types/order-model";
import { toCustomer, type CustomerRow } from "./customers";
import { getDb } from "./db";
import { isUuid } from "./ids";
import { customerTimeline, deriveOrderStatus, parseTagLabel, tagLabel } from "./order-calc";
import { collectAllPages } from "./paging";
import { normalizeSearchText, phoneSearchDigits } from "./text-search";
import { generateTrackingToken } from "./token";

// THE single place for order data access (Supabase/PostgreSQL).
// Writes that touch several tables call the database functions from supabase/migrations/0003_rpc.sql.
// The service_role key bypasses RLS: admin callers must run requireAdmin() first, and the
// public tracking query selects only the fields the customer may see.

type OrderRow = {
  id: string;
  order_number: number;
  tracking_token: string;
  customer_id: string;
  express_percent: number | null;
  estimated_ready_date: string | null;
  public_description: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  order_id: string;
  item_no: number;
  price_list_item_id: string | null;
  garment_name: string;
  unit_price_kurus: number | null;
  rack_location: string | null;
  note: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: number;
  item_id: string;
  from_status: ItemStatus | null;
  to_status: ItemStatus;
  kind: StatusEventKind;
  changed_at: string;
};

type OrderDetailsRow = OrderRow & { customer: CustomerRow; items: ItemRow[] };

const DETAILS = "*, customer:customers(*), items:order_items(*)";

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    trackingToken: row.tracking_token,
    customerId: row.customer_id,
    expressPercent: row.express_percent,
    estimatedReadyDate: row.estimated_ready_date,
    publicDescription: row.public_description,
    internalNote: row.internal_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toItem(row: ItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    itemNo: row.item_no,
    priceListItemId: row.price_list_item_id,
    garmentName: row.garment_name,
    unitPriceKurus: row.unit_price_kurus,
    rackLocation: row.rack_location,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toEvent(row: EventRow): ItemStatusEvent {
  return {
    id: row.id,
    itemId: row.item_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    kind: row.kind,
    changedAt: row.changed_at,
  };
}

function toOrderWithDetails(row: OrderDetailsRow): OrderWithDetails {
  return {
    ...toOrder(row),
    customer: toCustomer(row.customer),
    items: row.items.map(toItem).sort((a, b) => a.itemNo - b.itemNo),
  };
}

function fail(what: string, message: string): never {
  throw new Error(`Database error (${what}): ${message}`);
}

/** All orders with customer and items, newest first. Read page by page: no silent 1000-row cap. */
export async function listOrders(): Promise<OrderWithDetails[]> {
  await connection();
  const rows = await collectAllPages(async (from, to) => {
    const { data, error } = await getDb()
      .from("orders")
      .select(DETAILS)
      .order("created_at", { ascending: false })
      // Tie-breaker: orders created in one transaction share created_at; pages must not overlap.
      .order("id")
      .range(from, to)
      .returns<OrderDetailsRow[]>();
    if (error) fail("orders", error.message);
    return data;
  });
  return rows.map(toOrderWithDetails);
}

/** One customer's orders with customer and items, newest first. Empty for a malformed id. */
export async function listOrdersForCustomer(customerId: string): Promise<OrderWithDetails[]> {
  await connection();
  if (!isUuid(customerId)) return [];
  const rows = await collectAllPages(async (from, to) => {
    const { data, error } = await getDb()
      .from("orders")
      .select(DETAILS)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to)
      .returns<OrderDetailsRow[]>();
    if (error) fail("orders", error.message);
    return data;
  });
  return rows.map(toOrderWithDetails);
}

export type OrderSearch = {
  /** Free text: customer name, phone number, order number or tag number ("1048-1"). */
  query?: string;
  /** Compared with the status derived from the items. */
  status?: ItemStatus;
};

/** Orders matching the search, newest first. Filtered in memory: fine for one shop's volume. */
export async function searchOrders({ query = "", status }: OrderSearch): Promise<OrderWithDetails[]> {
  const orders = await listOrders();
  const text = normalizeSearchText(query.trim());
  const tag = parseTagLabel(query);
  // "0532 123 45 67", "+905321234567" and "05321234567" should all find the same phone.
  const digits = phoneSearchDigits(query);

  return orders.filter((order) => {
    if (status && deriveOrderStatus(order.items).status !== status) return false;
    if (!text) return true;
    if (tag) {
      return (
        order.orderNumber === tag.orderNumber &&
        order.items.some((item) => item.itemNo === tag.itemNo)
      );
    }
    return (
      normalizeSearchText(order.customer.name).includes(text) ||
      (digits.length > 0 && String(order.orderNumber).includes(digits)) ||
      (digits.length >= 4 && order.customer.phone.replace(/\D/g, "").includes(digits))
    );
  });
}

/** One order with customer, items and their status history (oldest first), or null. */
export async function getOrderDetail(
  id: string,
): Promise<{ order: OrderWithDetails; events: ItemStatusEvent[] } | null> {
  if (!isUuid(id)) return null;
  await connection();
  const db = getDb();

  const { data, error } = await db
    .from("orders")
    .select(DETAILS)
    .eq("id", id)
    .maybeSingle<OrderDetailsRow>();
  if (error) fail("order", error.message);
  if (!data) return null;

  const order = toOrderWithDetails(data);
  const itemIds = order.items.map((item) => item.id);
  if (itemIds.length === 0) return { order, events: [] };

  const events = await db
    .from("item_status_events")
    .select("*")
    .in("item_id", itemIds)
    .order("id")
    .returns<EventRow[]>();
  if (events.error) fail("status history", events.error.message);
  return { order, events: events.data.map(toEvent) };
}

/** Opens an order. The customer is found by phone, or created. */
export async function createOrder(input: {
  customerName: string;
  /** Already validated and normalized (E.164). */
  customerPhone: string;
}): Promise<Order> {
  const { data, error } = await getDb().rpc("create_order", {
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_tracking_token: generateTrackingToken(),
  });
  if (error) fail("create order", error.message);
  return toOrder(data as OrderRow);
}

/** Saves the editable order fields. Input must already be validated. False if the order does not exist. */
export async function updateOrder(
  id: string,
  update: Pick<Order, "expressPercent" | "estimatedReadyDate" | "publicDescription" | "internalNote">,
): Promise<boolean> {
  if (!isUuid(id)) return false;
  const { data, error } = await getDb()
    .from("orders")
    .update({
      express_percent: update.expressPercent,
      estimated_ready_date: update.estimatedReadyDate,
      public_description: update.publicDescription,
      internal_note: update.internalNote,
    })
    .eq("id", id)
    .select("id");
  if (error) fail("update order", error.message);
  return data.length > 0;
}

/** Adds a garment (next item number, status RECEIVED, first history event). Null if the order does not exist. */
export async function addOrderItem(input: {
  orderId: string;
  garmentName: string;
  priceListItemId: string | null;
  unitPriceKurus: number | null;
  rackLocation: string | null;
  note: string | null;
}): Promise<OrderItem | null> {
  if (!isUuid(input.orderId)) return null;
  const { data, error } = await getDb().rpc("add_order_item", {
    p_order_id: input.orderId,
    p_garment_name: input.garmentName,
    p_price_list_item_id: input.priceListItemId,
    p_unit_price_kurus: input.unitPriceKurus,
    p_rack_location: input.rackLocation,
    p_note: input.note,
  });
  if (error) {
    if (error.message === "order_not_found") return null;
    fail("add item", error.message);
  }
  return toItem(data as ItemRow);
}

/**
 * Changes one garment's status and records it (one database transaction).
 * "conflict": the status changed elsewhere since the screen was loaded.
 * Business rules (which status may follow which) are checked by the caller first.
 */
export async function changeItemStatus(input: {
  itemId: string;
  expectedStatus: ItemStatus;
  toStatus: ItemStatus;
  kind: StatusEventKind;
}): Promise<"ok" | "conflict" | "not_found"> {
  if (!isUuid(input.itemId)) return "not_found";
  const { error } = await getDb().rpc("change_item_status", {
    p_item_id: input.itemId,
    p_expected_status: input.expectedStatus,
    p_to_status: input.toStatus,
    p_kind: input.kind,
  });
  if (!error) return "ok";
  if (error.message === "status_conflict") return "conflict";
  if (error.message === "item_not_found") return "not_found";
  fail("change status", error.message);
}

/**
 * What a status change needs to know about one garment: its order (to check the item belongs
 * to the order on screen), its current status and its latest history event (for undo). Null if unknown.
 */
export async function getItemForStatusChange(itemId: string): Promise<{
  orderId: string;
  status: ItemStatus;
  latest: ItemStatusEvent | null;
} | null> {
  if (!isUuid(itemId)) return null;
  const db = getDb();

  const item = await db
    .from("order_items")
    .select("order_id, status")
    .eq("id", itemId)
    .maybeSingle<{ order_id: string; status: ItemStatus }>();
  if (item.error) fail("item", item.error.message);
  if (!item.data) return null;

  const latest = await db
    .from("item_status_events")
    .select("*")
    .eq("item_id", itemId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<EventRow>();
  if (latest.error) fail("item history", latest.error.message);

  return {
    orderId: item.data.order_id,
    status: item.data.status,
    latest: latest.data ? toEvent(latest.data) : null,
  };
}

// Tokens are base64url (see token.ts); demo tokens have a "demo-" prefix.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

type PublicOrderRow = {
  order_number: number;
  public_description: string | null;
  estimated_ready_date: string | null;
  customer: { name: string };
  items: { id: string; item_no: number; garment_name: string; status: ItemStatus }[];
};

/**
 * Public view of an order for /track/<token>, or null if the token is unknown.
 * Only the allowed columns are queried, and a new object is built from them,
 * so private data can never reach the public page by accident (spec §11).
 */
export async function getPublicOrderByToken(token: string): Promise<PublicOrder | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  await connection();
  const db = getDb();

  const { data, error } = await db
    .from("orders")
    .select(
      "order_number, public_description, estimated_ready_date, customer:customers(name), items:order_items(id, item_no, garment_name, status)",
    )
    .eq("tracking_token", token)
    .maybeSingle<PublicOrderRow>();
  if (error) fail("tracking", error.message);
  if (!data) return null;

  const items = [...data.items].sort((a, b) => a.item_no - b.item_no);
  // `kind` is read only to hide undone changes (customerTimeline); it never reaches the page.
  let events: {
    item_id: string;
    to_status: ItemStatus;
    kind: StatusEventKind;
    changed_at: string;
  }[] = [];
  if (items.length > 0) {
    const result = await db
      .from("item_status_events")
      .select("item_id, to_status, kind, changed_at")
      .in("item_id", items.map((item) => item.id))
      .order("id")
      .returns<typeof events>();
    if (result.error) fail("tracking history", result.error.message);
    events = result.data;
  }

  return {
    orderNumber: data.order_number,
    firstName: data.customer.name.split(/\s+/)[0],
    publicDescription: data.public_description,
    estimatedReadyDate: data.estimated_ready_date,
    summary: deriveOrderStatus(items),
    items: items.map((item) => ({
      label: tagLabel(data.order_number, item.item_no),
      garmentName: item.garment_name,
      status: item.status,
      timeline: customerTimeline(
        events
          .filter((event) => event.item_id === item.id)
          .map((event) => ({
            toStatus: event.to_status,
            kind: event.kind,
            changedAt: event.changed_at,
          })),
      ),
    })),
  };
}
