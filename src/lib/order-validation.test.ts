import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePriceToCents, resolveItemPrice, validateExpress } from "./order-validation.ts";

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
