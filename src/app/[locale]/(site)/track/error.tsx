"use client"; // Error boundaries must be client components.

import { ErrorFallback } from "@/components/ui/ErrorFallback";

// Catches failures on the customer tracking pages (e.g. Supabase unreachable or paused).
export default function TrackError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14">
      <ErrorFallback retry={retry} />
    </div>
  );
}
