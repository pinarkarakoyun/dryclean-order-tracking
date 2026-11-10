import { test } from "node:test";
import assert from "node:assert/strict";
import { canQuickChange, getNextItemStatus } from "./item-status.ts";

test("next status chain", () => {
  assert.equal(getNextItemStatus("RECEIVED"), "CLEANING");
  assert.equal(getNextItemStatus("CLEANING"), "IRONING");
  assert.equal(getNextItemStatus("IRONING"), "READY");
  assert.equal(getNextItemStatus("READY"), "DELIVERED");
  assert.equal(getNextItemStatus("DELIVERED"), null);
  assert.equal(getNextItemStatus("CANCELLED"), null);
});

test("quick change allows next and cancel only", () => {
  assert.equal(canQuickChange("RECEIVED", "CLEANING"), true);
  assert.equal(canQuickChange("RECEIVED", "IRONING"), false);
  assert.equal(canQuickChange("IRONING", "CANCELLED"), true);
  assert.equal(canQuickChange("DELIVERED", "CANCELLED"), false);
  assert.equal(canQuickChange("CANCELLED", "RECEIVED"), false);
});
