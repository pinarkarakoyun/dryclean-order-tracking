import type { formats } from "@/i18n/formats";
import type { Locale } from "@/i18n/routing";
import type messages from "../messages/nl.json";

// Makes translation keys type-checked: t("Home.titel") (typo) fails at build time.
// Dutch is the reference file; other languages must have the same keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
