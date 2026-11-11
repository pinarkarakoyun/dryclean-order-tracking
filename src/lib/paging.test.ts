import { test } from "node:test";
import assert from "node:assert/strict";
import { collectAllPages } from "./paging.ts";

/** A fake table with `total` rows, served like Supabase's .range(from, to) (inclusive). */
function fakeTable(total: number) {
  const calls: [number, number][] = [];
  const rows = Array.from({ length: total }, (_, index) => index);
  const fetchPage = async (from: number, to: number) => {
    calls.push([from, to]);
    return rows.slice(from, to + 1);
  };
  return { calls, fetchPage };
}

// Supabase returns at most 1000 rows per request without an error: every row must still come back.
test("collects every row past the page size", async () => {
  const table = fakeTable(2500);
  const rows = await collectAllPages(table.fetchPage, 1000);
  assert.equal(rows.length, 2500);
  assert.deepEqual(table.calls, [[0, 999], [1000, 1999], [2000, 2999]]);
});

test("an exact multiple asks once more and stops on the empty page", async () => {
  const table = fakeTable(1000);
  const rows = await collectAllPages(table.fetchPage, 1000);
  assert.equal(rows.length, 1000);
  assert.equal(table.calls.length, 2);
});

test("an empty table needs one request", async () => {
  const table = fakeTable(0);
  assert.deepEqual(await collectAllPages(table.fetchPage, 1000), []);
  assert.equal(table.calls.length, 1);
});
