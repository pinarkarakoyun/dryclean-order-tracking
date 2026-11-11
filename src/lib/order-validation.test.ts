import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePriceToCents, validateExpress } from "./order-validation.ts";

test("price input to kurus", () => {
  assert.deepEqual(parsePriceToCents("150,50"), { value: 15050 });
  assert.deepEqual(parsePriceToCents("₺ 150"), { value: 15000 });
  assert.deepEqual(parsePriceToCents(""), { value: null });
  assert.deepEqual(parsePriceToCents("1.500"), { error: "priceInvalid" });
});

test("express checkbox", () => {
  assert.equal(validateExpress("on"), 50);
  assert.equal(validateExpress(""), null);
});
