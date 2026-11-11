import { test } from "node:test";
import assert from "node:assert/strict";
import type { Product } from "@/types/order-model";
import {
  duplicateErrorKey,
  findDuplicateProduct,
  sortProducts,
  validateProductName,
} from "./product-validation.ts";

const p = (name: string, isActive = true, id = name): Product => ({ id, name, isActive });

test("name is trimmed and inner spaces collapse", () => {
  assert.deepEqual(validateProductName("  Takım   elbise "), { value: "Takım elbise" });
});
test("empty name is required", () => {
  assert.deepEqual(validateProductName("   "), { error: "nameRequired" });
});
test("name is limited to 60 characters", () => {
  assert.deepEqual(validateProductName("x".repeat(61)), { error: "nameTooLong" });
  assert.ok("value" in validateProductName("x".repeat(60)));
});
test("duplicate ignores case, Turkish letters and spacing", () => {
  const list = [p("Gömlek"), p("Takım elbise")];
  assert.deepEqual(findDuplicateProduct(list, "GÖMLEK"), { kind: "active", id: "Gömlek" });
  assert.deepEqual(findDuplicateProduct(list, "gomlek"), { kind: "active", id: "Gömlek" });
  assert.deepEqual(findDuplicateProduct(list, "takım  elbise"), { kind: "active", id: "Takım elbise" });
  assert.equal(findDuplicateProduct(list, "Pantolon"), null);
});
test("duplicate among hidden products says so", () => {
  assert.deepEqual(findDuplicateProduct([p("Yorgan", false)], "yorgan"), { kind: "hidden", id: "Yorgan" });
});
test("a product is not its own duplicate", () => {
  assert.equal(findDuplicateProduct([p("gömlek", true, "a")], "Gömlek", "a"), null);
});
test("products sort in Turkish alphabetical order", () => {
  const sorted = sortProducts([p("Dikiş"), p("Çanta"), p("Ceket"), p("Ütü")]);
  assert.deepEqual(sorted.map((x) => x.name), ["Ceket", "Çanta", "Dikiş", "Ütü"]);
});
test("sorting does not change the input", () => {
  const list = [p("B"), p("A")];
  sortProducts(list);
  assert.deepEqual(list.map((x) => x.name), ["B", "A"]);
});

test("duplicate message depends on the page: the rename page has no hidden list below", () => {
  assert.equal(duplicateErrorKey("active", "add"), "duplicateActive");
  assert.equal(duplicateErrorKey("hidden", "add"), "duplicateHidden");
  assert.equal(duplicateErrorKey("active", "rename"), "duplicateActive");
  assert.equal(duplicateErrorKey("hidden", "rename"), "duplicateHiddenRename");
});
