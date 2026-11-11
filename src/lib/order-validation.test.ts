import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePriceToCents,
  resolveItemPrice,
  resolveItemSource,
  validateExpress,
} from "./order-validation.ts";

test("item from the price list", () => {
  assert.deepEqual(resolveItemSource("list-id", ""), { value: { kind: "list", id: "list-id" } });
});

test("item typed by hand", () => {
  assert.deepEqual(resolveItemSource("", "Halı"), { value: { kind: "custom", name: "Halı" } });
});

// The form says "or": a typed name must not be silently ignored in favour of the list item.
test("list item and typed name together is an error", () => {
  assert.deepEqual(resolveItemSource("list-id", "Halı"), { error: "bothGiven" });
});

test("neither list item nor name", () => {
  assert.deepEqual(resolveItemSource("", ""), { error: "nameRequired" });
});

test("typed name too long", () => {
  assert.deepEqual(resolveItemSource("", "x".repeat(61)), { error: "tooLong" });
});

test("price input to kurus", () => {
  assert.deepEqual(parsePriceToCents("150,50"), { value: 15050 });
  assert.deepEqual(parsePriceToCents("₺ 150"), { value: 15000 });
  assert.deepEqual(parsePriceToCents(""), { value: null });
  assert.deepEqual(parsePriceToCents("1.500"), { error: "priceInvalid" });
});

// The same garment type is not always the same price: a typed price wins over the list price.
test("typed price wins over the list price", () => {
  assert.deepEqual(resolveItemPrice("150", 12000), { value: 15000 });
});

test("empty price falls back to the list price", () => {
  assert.deepEqual(resolveItemPrice("", 12000), { value: 12000 });
});

test("empty price without a list item stays empty", () => {
  assert.deepEqual(resolveItemPrice("", null), { value: null });
});

test("invalid typed price is an error, even with a list price", () => {
  assert.deepEqual(resolveItemPrice("abc", 12000), { error: "priceInvalid" });
});

test("express checkbox", () => {
  assert.equal(validateExpress("on"), 50);
  assert.equal(validateExpress(""), null);
});
