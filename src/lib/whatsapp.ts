// WhatsApp without any paid API: a wa.me link opens WhatsApp (app or web)
// with the chat and message already filled in. The owner only presses "send".

/**
 * Link that opens a chat with `phone` (E.164, e.g. "+31612345678") and a prepared message.
 * wa.me wants the number as digits only, without "+" or spaces.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
