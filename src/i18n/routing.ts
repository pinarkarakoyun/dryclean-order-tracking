import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // To drop a language, remove it here and delete its file in /messages.
  locales: ["nl", "tr", "en"],
  defaultLocale: "nl",
  // Dutch URLs have no prefix (/contact); others do (/tr/contact).
  localePrefix: "as-needed",
  // Always start in Dutch instead of guessing from browser settings,
  // so the shop staff and customers get a predictable experience.
  localeDetection: false,
  // No language cookie: the language always comes from the URL, so a cookie would
  // store something we never read. Fewer cookies = simpler privacy (no consent needed).
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
