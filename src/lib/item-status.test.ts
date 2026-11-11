import { test } from "node:test";
import assert from "node:assert/strict";
import type { ItemStatusEvent } from "@/types/order-model";
import {
  canTransition,
  getNextItemStatus,
  getPreviousItemStatus,
  getUndoTarget,
} from "./item-status.ts";

test("next status chain", () => {
  assert.equal(getNextItemStatus("RECEIVED"), "CLEANING");
  assert.equal(getNextItemStatus("CLEANING"), "IRONING");
  assert.equal(getNextItemStatus("IRONING"), "READY");
  assert.equal(getNextItemStatus("READY"), "DELIVERED");
  assert.equal(getNextItemStatus("DELIVERED"), null);
  assert.equal(getNextItemStatus("CANCELLED"), null);
});

test("previous status chain", () => {
  assert.equal(getPreviousItemStatus("RECEIVED"), null);
  assert.equal(getPreviousItemStatus("CLEANING"), "RECEIVED");
  assert.equal(getPreviousItemStatus("IRONING"), "CLEANING");
  assert.equal(getPreviousItemStatus("READY"), "IRONING");
  assert.equal(getPreviousItemStatus("DELIVERED"), "READY");
  assert.equal(getPreviousItemStatus("CANCELLED"), null);
});

// ---- Undo: only the item's latest change, never an undo itself (server-side check) ----

const event = (
  fromStatus: ItemStatusEvent["fromStatus"],
  toStatus: ItemStatusEvent["toStatus"],
  kind: ItemStatusEvent["kind"] = "normal",
): ItemStatusEvent => ({ id: 1, itemId: "item", fromStatus, toStatus, kind, changedAt: "" });

test("undo goes back to where the latest change came from", () => {
  assert.equal(getUndoTarget(event("RECEIVED", "CLEANING"), "CLEANING"), "RECEIVED");
  assert.equal(getUndoTarget(event("READY", "DELIVERED"), "DELIVERED"), "READY");
  assert.equal(getUndoTarget(event("IRONING", "CLEANING", "step_back"), "CLEANING"), "IRONING");
});

test("an undo cannot be undone", () => {
  assert.equal(getUndoTarget(event("CLEANING", "RECEIVED", "undo"), "RECEIVED"), null);
});

test("the first event (item added) cannot be undone", () => {
  assert.equal(getUndoTarget(event(null, "RECEIVED"), "RECEIVED"), null);
});

test("no undo when the item changed again since", () => {
  assert.equal(getUndoTarget(event("RECEIVED", "CLEANING"), "IRONING"), null);
  assert.equal(getUndoTarget(null, "CLEANING"), null);
});

// ---- canTransition: Pınar's rules (step 4) ----
// Decisions taken on 2026-11-11: a step may be skipped, a DELIVERED item may be moved back,
// a CANCELLED item may be brought back.

test("rule: a step may be skipped", () => {
  assert.equal(canTransition("CLEANING", "READY", "normal"), true);
  assert.equal(canTransition("RECEIVED", "READY", "normal"), true);
});

test("rule: the usual next step is allowed", () => {
  assert.equal(canTransition("RECEIVED", "CLEANING", "normal"), true);
  assert.equal(canTransition("READY", "DELIVERED", "normal"), true);
});

test("rule: a DELIVERED item may be moved back one step", () => {
  assert.equal(canTransition("DELIVERED", "READY", "step_back"), true);
});

test("rule: step back goes to the previous stage", () => {
  assert.equal(canTransition("IRONING", "CLEANING", "step_back"), true);
});

test("rule: an open item can be cancelled", () => {
  assert.equal(canTransition("IRONING", "CANCELLED", "normal"), true);
});

test("rule: staying on the same status is never a change", () => {
  for (const kind of ["normal", "step_back", "undo"] as const) {
    assert.equal(canTransition("CLEANING", "CLEANING", kind), false);
  }
});

test("rule: going backwards needs step_back, not normal", () => {
  assert.equal(canTransition("READY", "CLEANING", "normal"), false);
});

test("rule: undo is not decided here (the server checks the latest event)", () => {
  assert.equal(canTransition("CLEANING", "RECEIVED", "undo"), false);
});

// A cancelled item is brought back to the start (RECEIVED), like a newly received garment.
test("rule: a CANCELLED item can be brought back to RECEIVED", () => {
  assert.equal(canTransition("CANCELLED", "RECEIVED", "normal"), true);
  assert.equal(canTransition("CANCELLED", "READY", "normal"), false);
  assert.equal(canTransition("CANCELLED", "RECEIVED", "step_back"), false);
});

// A delivered garment is with the customer: it is moved back one step if wrong, never cancelled.
test("rule: a DELIVERED item cannot be cancelled", () => {
  assert.equal(canTransition("DELIVERED", "CANCELLED", "normal"), false);
});

test("rule: step back is only one step", () => {
  assert.equal(canTransition("DELIVERED", "CLEANING", "step_back"), false);
  assert.equal(canTransition("RECEIVED", "CANCELLED", "step_back"), false);
});
