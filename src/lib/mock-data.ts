import type { Locale } from "@/i18n/routing";
import type { Order, OrderStatus, StatusChange } from "@/types/order";
import { todayInShop } from "./order-utils";

// DEMO DATA ONLY. Names and phone numbers are fictional.
// Dates are relative to "now", so the demo always looks current.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type SeedOrder = {
  orderNumber: number;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  customerLanguage: Locale;
  serviceId?: string;
  clothingType?: string;
  publicDescription?: string;
  internalNote?: string;
  priceCents?: number;
  /** Ready date as days from today (negative = in the past). */
  readyInDays?: number;
  /** How long ago the order was created. */
  createdHoursAgo: number;
  /** Later status changes, as hours after creation. */
  history?: [OrderStatus, number][];
};

const seedOrders: SeedOrder[] = [
  {
    orderNumber: 1041,
    trackingToken: "demo-Qm3vX8kP2rT7wZ1yL5nB9cF4",
    customerName: "Jan de Vries",
    customerPhone: "+31612340001",
    customerLanguage: "nl",
    serviceId: "trouser-hem",
    clothingType: "Spijkerbroek",
    publicDescription: "Broek 4 cm inkorten",
    internalNote: "Originele zoom behouden.",
    priceCents: 1500,
    readyInDays: -7,
    createdHoursAgo: 12 * 24,
    history: [
      ["IN_PROGRESS", 24],
      ["READY_FOR_PICKUP", 3 * 24],
      ["DELIVERED", 5 * 24],
    ],
  },
  {
    orderNumber: 1042,
    trackingToken: "demo-Hs8dN2qW6eR4tY9uI3oP7aS1",
    customerName: "Ayşe Yılmaz",
    customerPhone: "+905550000002",
    customerLanguage: "tr",
    serviceId: "zipper-replacement",
    clothingType: "Jas",
    internalNote: "Klant heeft afgezegd.",
    createdHoursAgo: 10 * 24,
    history: [["CANCELLED", 20]],
  },
  {
    orderNumber: 1043,
    trackingToken: "demo-Kd5fG7hJ9kL2zX4cV6bN8mQ3",
    customerName: "Sanne Visser",
    customerPhone: "+31612340003",
    customerLanguage: "nl",
    serviceId: "jacket-alteration",
    clothingType: "Colbert",
    publicDescription: "Colbert taille innemen",
    internalNote: "2 cm innemen aan beide kanten.",
    priceCents: 4500,
    readyInDays: -1,
    createdHoursAgo: 6 * 24,
    history: [
      ["IN_PROGRESS", 24],
      ["READY_FOR_PICKUP", 5 * 24],
    ],
  },
  {
    orderNumber: 1044,
    trackingToken: "demo-Wp3eR5tY7uI9oA2sD4fG6hJ8",
    customerName: "Mehmet Kaya",
    customerPhone: "+31612340004",
    customerLanguage: "tr",
    serviceId: "sleeve-shortening",
    clothingType: "Overhemd",
    publicDescription: "Mouwen inkorten",
    internalNote: "Mouwen 3 cm korter.",
    priceCents: 2000,
    readyInDays: 0,
    createdHoursAgo: 5 * 24,
    history: [
      ["IN_PROGRESS", 30],
      ["READY_FOR_PICKUP", 4 * 24],
    ],
  },
  {
    orderNumber: 1045,
    trackingToken: "demo-Zx7cV9bN2mQ4wE6rT8yU1iO3",
    customerName: "Pieter Bakker",
    customerPhone: "+31612340005",
    customerLanguage: "nl",
    serviceId: "waist-adjustment",
    clothingType: "Pantalon",
    publicDescription: "Taille uitleggen",
    internalNote: "Taille 3 cm uitleggen, er is genoeg stof.",
    priceCents: 2500,
    readyInDays: -2,
    createdHoursAgo: 5 * 24,
    history: [["IN_PROGRESS", 48]],
  },
  {
    orderNumber: 1046,
    trackingToken: "demo-Lm4nB6vC8xZ1aS3dF5gH7jK9",
    customerName: "Fatma Demir",
    customerPhone: "+31612340006",
    customerLanguage: "tr",
    serviceId: "general-repair",
    clothingType: "Jurk",
    publicDescription: "Naad repareren",
    internalNote: "Zijnaad links open, ongeveer 10 cm.",
    priceCents: 1000,
    readyInDays: 0,
    createdHoursAgo: 3 * 24,
    history: [["IN_PROGRESS", 20]],
  },
  {
    orderNumber: 1047,
    trackingToken: "demo-Tg2hY4uJ6iK8oL1pZ3xC5vB7",
    customerName: "Emma Jansen",
    customerPhone: "+31612340007",
    customerLanguage: "nl",
    serviceId: "trouser-hem",
    clothingType: "Broek",
    publicDescription: "Twee broeken inkorten",
    internalNote: "Beide 5 cm. Zwart garen.",
    priceCents: 3000,
    readyInDays: 3,
    createdHoursAgo: 2 * 24,
    history: [["IN_PROGRESS", 18]],
  },
  {
    orderNumber: 1048,
    trackingToken: "demo-Rf9tG1yH3uJ5iK7oL2pA4sD6",
    customerName: "Lucas Smit",
    customerPhone: "+31612340008",
    customerLanguage: "en",
    serviceId: "other",
    clothingType: "Gordijnen",
    publicDescription: "Gordijnen inkorten",
    internalNote: "3 gordijnen, elk 10 cm korter. Prijs nog afspreken.",
    readyInDays: 5,
    createdHoursAgo: 26,
  },
  {
    orderNumber: 1049,
    trackingToken: "demo-Yb6nM8qW1eR3tY5uI7oP9aS2",
    customerName: "Zeynep Arslan",
    customerPhone: "+905550000009",
    customerLanguage: "tr",
    createdHoursAgo: 3,
  },
  {
    orderNumber: 1050,
    trackingToken: "demo-Uc3vB5nM7qW9eR2tY4uI6oP8",
    customerName: "Thomas Mulder",
    customerPhone: "+31612340010",
    customerLanguage: "nl",
    serviceId: "jacket-alteration",
    clothingType: "Winterjas",
    createdHoursAgo: 1,
  },
];

/** Builds the demo orders and their status history, relative to `now`. */
export function createSeedData(now: Date): {
  orders: Order[];
  statusChanges: StatusChange[];
} {
  const orders: Order[] = [];
  const statusChanges: StatusChange[] = [];

  for (const seed of seedOrders) {
    const id = `order-${seed.orderNumber}`;
    const createdAt = new Date(now.getTime() - seed.createdHoursAgo * HOUR);

    // Every order starts as RECEIVED at creation time.
    const history: [OrderStatus, Date][] = [["RECEIVED", createdAt]];
    for (const [status, hoursAfter] of seed.history ?? []) {
      history.push([status, new Date(createdAt.getTime() + hoursAfter * HOUR)]);
    }
    history.forEach(([status, changedAt], index) => {
      statusChanges.push({
        id: `${id}-status-${index + 1}`,
        orderId: id,
        status,
        changedAt: changedAt.toISOString(),
      });
    });
    const [lastStatus, lastChangedAt] = history[history.length - 1];

    orders.push({
      id,
      orderNumber: seed.orderNumber,
      trackingToken: seed.trackingToken,
      customerName: seed.customerName,
      customerPhone: seed.customerPhone,
      customerLanguage: seed.customerLanguage,
      serviceId: seed.serviceId ?? null,
      clothingType: seed.clothingType ?? null,
      publicDescription: seed.publicDescription ?? null,
      internalNote: seed.internalNote ?? null,
      priceCents: seed.priceCents ?? null,
      estimatedReadyDate:
        seed.readyInDays === undefined
          ? null
          : todayInShop(new Date(now.getTime() + seed.readyInDays * DAY)),
      status: lastStatus,
      createdAt: createdAt.toISOString(),
      updatedAt: lastChangedAt.toISOString(),
    });
  }

  return { orders, statusChanges };
}
