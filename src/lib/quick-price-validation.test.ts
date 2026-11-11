import { test } from "node:test";
import assert from "node:assert/strict";
import type { QuickPrice } from "@/types/order-model";
import { sortQuickPrices, validateQuickPrice } from "./quick-price-validation.ts";

const q = (amountKurus: number): QuickPrice => ({ id: String(amountKurus), amountKurus });

test("amount is read in kuruş", () => {
  assert.deepEqual(validateQuickPrice("175", []), { value: 17500 });
  assert.deepEqual(validateQuickPrice("175,50", []), { value: 17550 });
  assert.deepEqual(validateQuickPrice("₺ 175", []), { value: 17500 });
});
test("empty amount is required", () => {
  assert.deepEqual(validateQuickPrice(" ", []), { error: "amountRequired" });
});
test("zero, text and thousand separators are invalid", () => {
  for (const raw of ["0", "0,00", "abc", "1.500", "-5"]) {
    assert.deepEqual(validateQuickPrice(raw, []), { error: "amountInvalid" }, raw);
  }
});
test("the same amount written differently is a duplicate", () => {
  assert.deepEqual(validateQuickPrice("150,00", [q(15000)]), { error: "duplicate" });
});
test("at most 8 quick prices", () => {
  const eight = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => q(n * 1000));
  assert.deepEqual(validateQuickPrice("999", eight), { error: "limit" });
  assert.ok("value" in validateQuickPrice("999", eight.slice(1)));
});
test("quick prices sort from low to high without changing the input", () => {
  const list = [q(30000), q(10000), q(20000)];
  assert.deepEqual(sortQuickPrices(list).map((x) => x.amountKurus), [10000, 20000, 30000]);
  assert.deepEqual(list.map((x) => x.amountKurus), [30000, 10000, 20000]);
});
