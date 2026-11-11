// Checks that the app can reach Supabase with the keys in .env.local.
// Run: node --env-file=.env.local supabase/checks/connection.mjs
// Prints only a count or an error message, never a key.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("FAIL: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { count, error } = await db
  .from("price_list_items")
  .select("id", { count: "exact", head: true });

if (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
console.log(`OK: connected, ${count} price list items`);
