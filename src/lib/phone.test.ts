import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone } from "./phone.ts";

// One phone number is one customer, so every spelling must give the same value.
test("same number, different spellings", () => {
  assert.equal(normalizePhone("0532 123 45 67"), "+905321234567");
  assert.equal(normalizePhone("+90 532 123 45 67"), "+905321234567");
  assert.equal(normalizePhone("12345"), null);
});
