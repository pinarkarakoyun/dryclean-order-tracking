import type { Formats } from "next-intl";

// Named date and number formats, used as format.dateTime(date, "dateLong").
// Each language applies its own conventions (e.g. "Sal 20 Ekim").
export const formats = {
  dateTime: {
    /** e.g. "Sal 20 Ekim" */
    dateLong: { weekday: "short", day: "numeric", month: "long" },
    /** e.g. "20 Eki 2026" */
    date: { day: "numeric", month: "short", year: "numeric" },
    /** e.g. "20 Eki 2026 14:35" */
    dateTime: {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  },
  number: {
    /** Price in Turkish lira, e.g. "₺150,00". Pass kuruş / 100. */
    price: { style: "currency", currency: "TRY" },
  },
} satisfies Formats;
