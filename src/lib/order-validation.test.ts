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

// The price only comes from the price box: products have no price of their own.
test("typed price is used as the item price", () => {
  assert.deepEqual(resolveItemPrice("150"), { value: 15000 });
  assert.deepEqual(resolveItemPrice("150,50"), { value: 15050 });
});

test("empty price stays empty", () => {
  assert.deepEqual(resolveItemPrice(""), { value: null });
});

test("invalid typed price is an error", () => {
  assert.deepEqual(resolveItemPrice("abc"), { error: "priceInvalid" });
});

test("express checkbox", () => {
  assert.equal(validateExpress("on", null), 50);
  assert.equal(validateExpress("", null), null);
  assert.equal(validateExpress("", 50), null);
});

// The rate is copied onto the order once (spec §3): editing an old express order keeps its rate.
test("an express order keeps its stored rate when edited", () => {
  assert.equal(validateExpress("on", 40), 40);
});
