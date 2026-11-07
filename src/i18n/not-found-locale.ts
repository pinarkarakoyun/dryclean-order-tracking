import { hasLocale } from "next-intl";
import { routing, type Locale } from "./routing";

/**
 * Request header with the visitor's language, set by src/proxy.ts when it
 * sends a request straight to the 404 page (order module turned off).
 * The 404 page has no URL parameters, so this is how it learns the language.
 */
export const NOT_FOUND_LOCALE_HEADER = "x-mustan-not-found-locale";

/** The language from the header, or null when it is missing or unknown. */
export function parseNotFoundLocale(value: string | null): Locale | null {
  return hasLocale(routing.locales, value) ? value : null;
}
