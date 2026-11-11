import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterCustomers,
  sortCustomers,
  withOrderStats,
  type CustomerListEntry,
} from "./customer-search.ts";

let nextId = 0;
const customer = (overrides: Partial<CustomerListEntry> = {}): CustomerListEntry => ({
  id: `c${++nextId}`,
  name: "Test Kişi",
  phone: "+905550000009",
  preferenceNote: null,
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
  orderCount: 0,
  lastOrderAt: null,
  ...overrides,
});

const names = (list: CustomerListEntry[]) => list.map((c) => c.name);

// ---- filterCustomers ----

test("name search ignores case and Turkish letters", () => {
  const list = [
    customer({ name: "Elif Kaya" }),
    customer({ name: "Ahmet Yılmaz" }),
    customer({ name: "Mehmet Çelik" }),
  ];
  assert.deepEqual(names(filterCustomers(list, "ELİF")), ["Elif Kaya"]);
  assert.deepEqual(names(filterCustomers(list, "elif")), ["Elif Kaya"]);
  assert.deepEqual(names(filterCustomers(list, "yilmaz")), ["Ahmet Yılmaz"]);
  assert.deepEqual(names(filterCustomers(list, "celik")), ["Mehmet Çelik"]);
});

test("phone search uses digits only and ignores the leading 0", () => {
  const list = [
    customer({ name: "Elif Kaya", phone: "+905550000001" }),
    customer({ name: "Ahmet Yılmaz", phone: "+905321112233" }),
  ];
  assert.deepEqual(names(filterCustomers(list, "0555 000")), ["Elif Kaya"]);
  assert.deepEqual(names(filterCustomers(list, "+90 555 000")), ["Elif Kaya"]);
});

test("fewer than 3 digits never matches a phone", () => {
  const list = [
    customer({ name: "Elif Kaya", phone: "+905550000001" }),
    customer({ name: "Ahmet Yılmaz", phone: "+905321112235" }),
  ];
  assert.deepEqual(filterCustomers(list, "05"), []);
});

test("empty search returns the list unchanged", () => {
  const list = [customer({ name: "A" }), customer({ name: "B" })];
  assert.deepEqual(filterCustomers(list, ""), list);
  assert.deepEqual(filterCustomers(list, "   "), list);
});

// ---- withOrderStats ----

test("order count and last order date per customer", () => {
  const a = customer({ name: "A" });
  const b = customer({ name: "B" });
  const result = withOrderStats(
    [a, b],
    [
      { customerId: a.id, createdAt: "2026-11-01T10:00:00Z" },
      { customerId: a.id, createdAt: "2026-11-05T10:00:00Z" },
    ],
  );
  assert.equal(result[0].orderCount, 2);
  assert.equal(result[0].lastOrderAt, "2026-11-05T10:00:00Z");
  assert.equal(result[1].orderCount, 0);
  assert.equal(result[1].lastOrderAt, null);
});

// ---- sortCustomers ----

test("latest order first, customers without orders last (newest first)", () => {
  const list = [
    customer({ name: "NoOrderOld", createdAt: "2026-10-01T00:00:00Z" }),
    customer({ name: "Older", lastOrderAt: "2026-11-01T00:00:00Z", orderCount: 1 }),
    customer({ name: "NoOrderNew", createdAt: "2026-11-09T00:00:00Z" }),
    customer({ name: "Newer", lastOrderAt: "2026-11-08T00:00:00Z", orderCount: 1 }),
  ];
  assert.deepEqual(names(sortCustomers(list)), ["Newer", "Older", "NoOrderNew", "NoOrderOld"]);
});

test("ties are ordered by name, then id", () => {
  const same = "2026-11-08T00:00:00Z";
  const list = [
    customer({ id: "b", name: "Zeynep", lastOrderAt: same }),
    customer({ id: "z", name: "Çağla", lastOrderAt: same }),
    customer({ id: "a", name: "Çağla", lastOrderAt: same }),
  ];
  assert.deepEqual(
    sortCustomers(list).map((c) => c.id),
    ["a", "z", "b"],
  );
});

test("sorting does not change the input array", () => {
  const list = [customer({ name: "B" }), customer({ name: "A" })];
  const copy = [...list];
  sortCustomers(list);
  assert.deepEqual(list, copy);
});
