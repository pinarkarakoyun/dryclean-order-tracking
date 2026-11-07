import { Open_Sans, Playfair_Display, Vidaloka } from "next/font/google";

// next/font downloads the fonts at build time and serves them ourselves,
// so visitors' browsers never contact Google (better for privacy/GDPR).

/** Headings: the serif of the shop sign and the current website. Only one weight exists. */
export const vidaloka = Vidaloka({
  weight: "400",
  // Vidaloka only has basic Latin: Dutch is fine, but Turkish ı, İ, ş, ğ are missing.
  subsets: ["latin"],
  variable: "--font-vidaloka",
  // Without this, next/font adds a "Vidaloka Fallback" (Times New Roman) that would
  // draw the missing Turkish letters before Playfair Display gets the chance.
  adjustFontFallback: false,
  fallback: [],
});

/**
 * Fallback for the letters Vidaloka does not have (Turkish), in a similar classic style.
 * Only the "latin-ext" part is included, and browsers only download it when such a letter appears.
 */
export const playfair = Playfair_Display({
  subsets: ["latin-ext"],
  variable: "--font-playfair",
  preload: false,
});

/** Body text, as on the current website. */
export const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-open-sans",
});

/** Class names to put on <html>. */
export const fontVariables = `${vidaloka.variable} ${playfair.variable} ${openSans.variable}`;
