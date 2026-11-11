import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseConfig } from "./supabase-config";

// THE single database client. "server-only" makes the build fail if a client
// component ever imports this file, so the service_role key cannot reach a browser.
// The key bypasses RLS: every caller must run requireAdmin() first (or only return public fields).

let client: SupabaseClient | undefined;

export function getDb(): SupabaseClient {
  if (!client) {
    const { url, serviceRoleKey } = readSupabaseConfig(process.env);
    client = createClient(url, serviceRoleKey, {
      // A server-side key, not a user login: nothing to store or refresh.
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
