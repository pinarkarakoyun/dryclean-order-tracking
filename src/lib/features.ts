// Feature switches, read from environment variables in ONE place.
// The rest of the code asks these functions instead of reading process.env.

/**
 * The order module: admin panel (/admin), customer tracking (/track),
 * QR codes and WhatsApp order messages.
 *
 * On only when ENABLE_ORDER_TRACKING is exactly "true". A missing or mistyped
 * value keeps the module off: better hidden than half-exposed.
 *
 * Public pages are pre-rendered at build time, so after changing the value:
 * restart `npm run dev`, or build again for production.
 */
export function isOrderTrackingEnabled(): boolean {
  return process.env.ENABLE_ORDER_TRACKING === "true";
}
