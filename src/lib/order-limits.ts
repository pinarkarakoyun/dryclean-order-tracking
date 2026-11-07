// Maximum lengths for order fields. In a separate file without dependencies,
// so client components (forms) can import it without pulling in server code.
export const LIMITS = {
  name: 100,
  phone: 30,
  clothingType: 60,
  publicDescription: 120,
  internalNote: 1000,
  /** Highest accepted price in euros. */
  priceEuros: 10_000,
} as const;
