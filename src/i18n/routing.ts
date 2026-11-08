import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // To add a language, add it here and create its file in /messages.
  locales: ["tr"],
  defaultLocale: "tr",
  // URLs of the default language have no prefix (/track).
  localePrefix: "as-needed",
  // Always start in Turkish instead of guessing from browser settings,
  // so the shop staff and customers get a predictable experience.
  localeDetection: false,
  // No language cookie: the language always comes from the URL, so a cookie would
  // store something we never read. Fewer cookies = simpler privacy (no consent needed).
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
