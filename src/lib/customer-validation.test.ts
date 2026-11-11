import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReturnTo, validateCustomerForm } from "./customer-validation.ts";

const valid = { name: "Elif Kaya", phone: "0555 000 00 02", preferenceNote: "Kola istemiyor" };

test("valid customer form gives clean values with an E.164 phone", () => {
  assert.deepEqual(validateCustomerForm(valid), {
    value: { name: "Elif Kaya", phone: "+905550000002", preferenceNote: "Kola istemiyor" },
  });
});

test("an empty preference note is stored as null", () => {
  const result = validateCustomerForm({ ...valid, preferenceNote: "" });
  assert.ok("value" in result);
  assert.equal(result.value.preferenceNote, null);
});

test("missing name and invalid phone are reported per field", () => {
  assert.deepEqual(validateCustomerForm({ ...valid, name: "", phone: "abc" }), {
    errors: { name: "nameRequired", phone: "phoneInvalid" },
  });
});

test("preference note is limited to 300 characters", () => {
  assert.deepEqual(validateCustomerForm({ ...valid, preferenceNote: "x".repeat(301) }), {
    errors: { preferenceNote: "preferenceNoteTooLong" },
  });
  assert.ok("value" in validateCustomerForm({ ...valid, preferenceNote: "x".repeat(300) }));
});

const uuid = "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b";

test("return to the order when it is a valid order id", () => {
  assert.deepEqual(parseReturnTo(`order:${uuid}`), { kind: "order", orderId: uuid });
});

test("anything else returns to the customer page", () => {
  for (const from of [
    "",
    "order:",
    "order:https://evil.example",
    "order:../../x",
    "https://evil.example",
    "customer",
  ]) {
    assert.deepEqual(parseReturnTo(from), { kind: "customer" }, from);
  }
});
