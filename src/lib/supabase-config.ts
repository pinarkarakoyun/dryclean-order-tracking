// Reads the Supabase settings from environment variables, in one place.
// Error messages name the missing variable but never include a value.

export type SupabaseConfig = { url: string; serviceRoleKey: string };

export function readSupabaseConfig(env: Record<string, string | undefined>): SupabaseConfig {
  const url = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const missing = [
    !url && "SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(
      `Supabase is not configured: set ${missing.join(" and ")} in .env.local (see .env.example).`,
    );
  }
  if (!url!.startsWith("https://")) {
    throw new Error("SUPABASE_URL must start with https:// (Supabase → Project Settings → API).");
  }
  return { url: url!, serviceRoleKey: serviceRoleKey! };
}
