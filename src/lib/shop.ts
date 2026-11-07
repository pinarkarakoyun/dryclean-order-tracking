// Business information shown on the public site.
// Address and phone come from the current website (kledingreparatie-mustan.nl).
// TODO (owner): confirm WhatsApp number, opening hours and the social media links.

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type OpeningHours = {
  day: Weekday;
  /** null = closed that day. Times as "HH:MM". */
  hours: { open: string; close: string } | null;
};

export const shop = {
  name: "Mustan",
  /** Shown under the name, like on the shop sign and the current website. */
  tagline: "Kledingreparatie & Stomerij",
  fullName: "Mustan Kledingreparatie & Stomerij",
  yearsOfExperience: 25,
  address: {
    street: "Nieuwe Ebbingestraat 54",
    postalCode: "9712 NM",
    city: "Groningen",
  },
  /** Phone as shown to visitors. */
  phoneDisplay: "050 313 0801",
  /** Phone in international format, used for tel: links. */
  phone: "+31503130801",
  /** WhatsApp number in international format. DEMO VALUE until the owner confirms it. */
  whatsapp: "+31612345678",
  /** Social media pages. Placeholders until the owner sends the real links. */
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
  },
  // DEMO VALUES: confirm with the owner.
  openingHours: [
    { day: "mon", hours: null },
    { day: "tue", hours: { open: "09:00", close: "18:00" } },
    { day: "wed", hours: { open: "09:00", close: "18:00" } },
    { day: "thu", hours: { open: "09:00", close: "18:00" } },
    { day: "fri", hours: { open: "09:00", close: "18:00" } },
    { day: "sat", hours: { open: "10:00", close: "17:00" } },
    { day: "sun", hours: null },
  ] satisfies OpeningHours[],
};

export function shopAddressLine(): string {
  const { street, postalCode, city } = shop.address;
  return `${street}, ${postalCode} ${city}`;
}

/** Link that opens the address in Google Maps (no embedded map = no third-party cookies). */
export function shopMapsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.fullName}, ${shopAddressLine()}`)}`;
}

/** Opens a WhatsApp chat with the shop. */
export function shopWhatsAppUrl(): string {
  return `https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`;
}
