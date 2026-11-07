import { randomBytes } from "node:crypto";

/**
 * Secret token for the public tracking URL (/track/<token>).
 * 24 random bytes = 192 bits: impossible to guess, unlike order numbers.
 * base64url only uses URL-safe characters (A-Z a-z 0-9 - _).
 */
export function generateTrackingToken(): string {
  return randomBytes(24).toString("base64url");
}
