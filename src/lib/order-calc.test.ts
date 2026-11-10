import { test } from "node:test";
import assert from "node:assert/strict";
import type { ItemStatus } from "@/types/order-model";
import { calculateOrderTotal, deriveOrderStatus, parseTagLabel, tagLabel } from "./order-calc.ts";

test("tagLabel joins order and item number", () => {
  assert.equal(tagLabel(1048, 1), "1048-1");
});

test("parseTagLabel accepts spaces", () => {
  assert.deepEqual(parseTagLabel(" 1048 - 2 "), { orderNumber: 1048, itemNo: 2 });
});

test("parseTagLabel rejects bad input", () => {
  for (const bad of ["1048", "1048-", "-1", "1048-0", "abc-1", "1048-1-2"]) {
    assert.equal(parseTagLabel(bad), null, bad);
  }
});

const s = (...statuses: ItemStatus[]) => statuses.map((status) => ({ status }));

test("no items", () => {
  assert.deepEqual(deriveOrderStatus([]), {
    status: "RECEIVED",
    noItems: true,
    partiallyDelivered: false,
  });
});

test("all cancelled", () => {
  assert.equal(deriveOrderStatus(s("CANCELLED", "CANCELLED")).status, "CANCELLED");
});

test("all active delivered", () => {
  assert.equal(deriveOrderStatus(s("DELIVERED", "CANCELLED")).status, "DELIVERED");
});

test("ready with partial delivery", () => {
  assert.deepEqual(deriveOrderStatus(s("READY", "DELIVERED")), {
    status: "READY",
    noItems: false,
    partiallyDelivered: true,
  });
});

test("all ready, none delivered", () => {
  assert.equal(deriveOrderStatus(s("READY", "READY")).partiallyDelivered, false);
});

test("least advanced wins", () => {
  assert.equal(
    deriveOrderStatus(s("IRONING", "CLEANING", "READY", "CANCELLED")).status,
    "CLEANING",
  );
});

const p = (status: ItemStatus, unitPriceKurus: number | null) => ({ status, unitPriceKurus });

test("total without express", () => {
  assert.deepEqual(calculateOrderTotal([p("RECEIVED", 15000), p("READY", 5050)], null), {
    kind: "complete",
    kurus: 20050,
  });
});

test("express 50 rounds half up", () => {
  assert.deepEqual(calculateOrderTotal([p("RECEIVED", 1)], 50), { kind: "complete", kurus: 2 });
});

test("express 50 on 15050", () => {
  assert.deepEqual(calculateOrderTotal([p("RECEIVED", 15050)], 50), {
    kind: "complete",
    kurus: 22575,
  });
});

test("cancelled items ignored, even without price", () => {
  assert.deepEqual(calculateOrderTotal([p("CANCELLED", null), p("RECEIVED", 100)], null), {
    kind: "complete",
    kurus: 100,
  });
});

test("missing price makes total incomplete", () => {
  assert.deepEqual(calculateOrderTotal([p("RECEIVED", 100), p("CLEANING", null)], 50), {
    kind: "incomplete",
  });
});

test("no active items totals zero", () => {
  assert.deepEqual(calculateOrderTotal([], 50), { kind: "complete", kurus: 0 });
});
