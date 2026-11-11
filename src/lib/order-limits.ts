// Limits for order fields. In a separate file without dependencies,
// so client components (forms) can import it without pulling in server code.
export const LIMITS = {
  name: 100,
  phone: 30,
  publicDescription: 120,
  internalNote: 1000,
  garmentName: 60,
  rackLocation: 20,
  itemNote: 300,
  /** Highest accepted price in Turkish lira. */
  priceLira: 100_000,
} as const;

/** Express surcharge in percent, copied onto the order when express is ticked. */
export const EXPRESS_PERCENT = 50;
