import type { Locale } from "@/i18n/routing";

export type Service = {
  /** Stable, readable id, e.g. "trouser-hem". */
  id: string;
  /** Name per language. Stored with the data (not in /messages) because the owner will manage this list. */
  name: Record<Locale, string>;
  /** One short sentence for the website, per language. */
  description: Record<Locale, string>;
  /** "From" price in cents (integer, avoids floating point errors). null = not confirmed yet. */
  fromPriceCents: number | null;
  /** Inactive services are hidden but kept, so old orders still reference them. */
  isActive: boolean;
  sortOrder: number;
};
