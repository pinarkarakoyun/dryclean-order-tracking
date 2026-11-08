import { parsePhoneNumberFromString } from "libphonenumber-js/max";

// Numbers without a country code must be Turkish ("0532 123 45 67"); anything else
// is rejected, so a mistyped number fails instead of matching another country.
// Numbers starting with "+" work for any country.
const DEFAULT_COUNTRY = "TR";

/** Returns the number in international E.164 format ("+905321234567"), or null if invalid. */
export function normalizePhone(input: string): string | null {
  const phone = parsePhoneNumberFromString(input, DEFAULT_COUNTRY);
  return phone?.isValid() ? phone.number : null;
}

/** Readable international format, e.g. "+90 532 123 45 67". */
export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
