import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "./routing";

/**
 * Call at the top of every layout and page under /[locale].
 * Validates the language from the URL (unknown -> 404) and tells next-intl
 * which language to use, so pages can be pre-rendered (static rendering).
 */
export async function initPageLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return locale;
}
