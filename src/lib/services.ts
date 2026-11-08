import type { Service } from "@/types/service";

/** The catch-all service; details go in the order notes. */
export const OTHER_SERVICE_ID = "other";

// Mock data. Names and prices to be confirmed with the owner.
const services: Service[] = [
  {
    id: "dry-cleaning",
    name: { tr: "Kuru temizleme" },
    description: {
      tr: "Kıyafetleriniz profesyonelce temizlenir ve ütülenir.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: OTHER_SERVICE_ID,
    name: { tr: "Diğer" },
    description: {
      tr: "Başka bir şey mi? Bize sorun.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 99,
  },
];

// Async on purpose: a real database call will be async too,
// so pages don't need to change when this is replaced.
export async function getActiveServices(): Promise<Service[]> {
  return services
    .filter((service) => service.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** All services, including inactive ones (old orders may still reference them). */
export async function getAllServices(): Promise<Service[]> {
  return [...services].sort((a, b) => a.sortOrder - b.sortOrder);
}
