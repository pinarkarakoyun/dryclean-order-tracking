"use client"; // Error boundaries must be client components.

import { ErrorFallback } from "@/components/ui/ErrorFallback";

// Catches failures in every admin panel page (e.g. Supabase unreachable or paused).
export default function AdminError({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorFallback retry={retry} />;
}
