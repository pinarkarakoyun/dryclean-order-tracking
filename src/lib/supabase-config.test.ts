import { test } from "node:test";
import assert from "node:assert/strict";
import { readSupabaseConfig } from "./supabase-config.ts";

test("reads both values", () => {
  assert.deepEqual(
    readSupabaseConfig({
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "k",
    }),
    { url: "https://x.supabase.co", serviceRoleKey: "k" },
  );
});

test("missing key explains what to set", () => {
  assert.throws(
    () => readSupabaseConfig({ SUPABASE_URL: "https://x.supabase.co" }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});

test("missing url explains what to set", () => {
  assert.throws(() => readSupabaseConfig({ SUPABASE_SERVICE_ROLE_KEY: "k" }), /SUPABASE_URL/);
});

test("error never contains the key value", () => {
  assert.throws(
    () => readSupabaseConfig({ SUPABASE_URL: "http://x", SUPABASE_SERVICE_ROLE_KEY: "secret-123" }),
    (error: Error) => !error.message.includes("secret-123"),
  );
});
