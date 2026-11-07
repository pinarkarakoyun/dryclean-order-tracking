import { parsePhoneNumberFromString } from "libphonenumber-js/max";

// Most customers have a Dutch or Turkish number. Numbers without a country code are
// tried as Dutch first ("06 12345678"), then as Turkish ("0532 123 45 67").
// Numbers starting with "+" or "00" work for any country.
const COUNTRIES_TO_TRY = ["NL", "TR"] as const;

/** Returns the number in international E.164 format ("+31612345678"), or null if invalid. */
export function normalizePhone(input: string): string | null {
  for (const country of COUNTRIES_TO_TRY) {
    const phone = parsePhoneNumberFromString(input, country);
    if (phone?.isValid()) {
      return phone.number;
    }
  }
  return null;
}

/** Readable international format, e.g. "+31 6 12345678". */
export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
