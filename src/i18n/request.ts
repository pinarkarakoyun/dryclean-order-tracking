import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { formats } from "./formats";
import { routing } from "./routing";

// Loads the translation file for the current request's language.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    timeZone: "Europe/Amsterdam",
    formats,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
