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
  preferenceNote: 300,
  /** Highest accepted price in Turkish lira. */
  priceLira: 100_000,
} as const;

/** Express surcharge in percent, copied onto the order when express is ticked. */
export const EXPRESS_PERCENT = 50;

/**
 * Quick price buttons on the "add item" form, in kuruş. A fixed list, so the buttons
 * never move. EXAMPLE VALUES: replace with the shop's real prices (panel editing in step 5).
 */
export const QUICK_PRICES_KURUS = [10_000, 15_000, 20_000, 25_000, 30_000, 40_000] as const;
