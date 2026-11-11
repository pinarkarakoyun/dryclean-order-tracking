const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a UUID. Ids from URLs and forms are checked before they reach the database. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
