/** Supabase returns at most this many rows per request (the project's "Max rows" default). */
export const SUPABASE_PAGE_SIZE = 1000;

/**
 * Reads a whole result set page by page. Supabase silently stops at its row limit,
 * so a single request would quietly drop the oldest orders once there are more than 1000.
 * `fetchPage(from, to)` returns the rows from..to (inclusive, like .range()).
 */
export async function collectAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize: number = SUPABASE_PAGE_SIZE,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    all.push(...page);
    if (page.length < pageSize) return all;
  }
}
