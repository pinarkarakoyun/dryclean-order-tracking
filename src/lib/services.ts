import type { Service } from "@/types/service";

/** The catch-all service; details go in the order notes. */
export const OTHER_SERVICE_ID = "other";

// Mock data. List from the PRD and the current website; names and prices to be confirmed with the owner.
const services: Service[] = [
  {
    id: "trouser-hem",
    name: { nl: "Broek inkorten", tr: "Paça kısaltma", en: "Trouser hemming" },
    description: {
      nl: "Broeken en pantalons korter maken, ook met originele zoom.",
      tr: "Pantolon ve kumaş pantolonları kısaltma, orijinal paça korunarak da.",
      en: "Shortening trousers, also keeping the original hem.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "sleeve-shortening",
    name: { nl: "Mouwen inkorten", tr: "Kol kısaltma", en: "Sleeve shortening" },
    description: {
      nl: "Mouwen van colberts, mantels en overhemden langer of korter maken.",
      tr: "Ceket, palto ve gömlek kollarını uzatma veya kısaltma.",
      en: "Making sleeves of jackets, coats and shirts longer or shorter.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "waist-adjustment",
    name: {
      nl: "Taille innemen of uitleggen",
      tr: "Bel daraltma / genişletme",
      en: "Waist adjustment",
    },
    description: {
      nl: "Broeken, rokken en jurken passend maken in de taille.",
      tr: "Pantolon, etek ve elbiseleri belden tam oturur hale getirme.",
      en: "Making trousers, skirts and dresses fit at the waist.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "zipper-replacement",
    name: { nl: "Rits vervangen", tr: "Fermuar değişimi", en: "Zipper replacement" },
    description: {
      nl: "Alle soorten ritsen, ook waterdichte ritsen in jassen.",
      tr: "Her tür fermuar, montlarda su geçirmez fermuarlar dahil.",
      en: "All kinds of zippers, including waterproof zippers in jackets.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "jacket-alteration",
    name: {
      nl: "Jas of colbert vermaken",
      tr: "Ceket / mont tadilatı",
      en: "Jacket alteration",
    },
    description: {
      nl: "Colberts, mantels en jassen perfect op maat.",
      tr: "Ceket, palto ve montları tam ölçünüze göre ayarlama.",
      en: "Jackets, coats and blazers tailored to fit perfectly.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "general-repair",
    name: {
      nl: "Reparaties (scheuren, knopen, naden)",
      tr: "Genel tamir (yırtık, düğme, dikiş)",
      en: "General repairs (tears, buttons, seams)",
    },
    description: {
      nl: "Scheuren, losse naden en knopen netjes hersteld.",
      tr: "Yırtıklar, sökülen dikişler ve düğmeler özenle onarılır.",
      en: "Tears, loose seams and buttons neatly repaired.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "leather-repair",
    name: { nl: "Leer repareren", tr: "Deri tamiri", en: "Leather repair" },
    description: {
      nl: "Reparatie van leren jassen en leren tassen.",
      tr: "Deri ceket ve deri çanta tamiri.",
      en: "Repairs of leather jackets and leather bags.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "down-jacket-repair",
    name: { nl: "Donsjassen repareren", tr: "Kaz tüyü mont tamiri", en: "Down jacket repair" },
    description: {
      nl: "Brandplekken en scheuren in (ganzen)donsjassen, ook merkjassen.",
      tr: "Kaz tüyü montlarda yanık ve yırtıklar, marka montlar dahil.",
      en: "Burns and tears in down jackets, including designer brands.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 8,
  },
  {
    id: "dry-cleaning",
    name: { nl: "Stomerij", tr: "Kuru temizleme", en: "Dry cleaning" },
    description: {
      nl: "Uw kleding professioneel gereinigd en geperst.",
      tr: "Kıyafetleriniz profesyonelce temizlenir ve ütülenir.",
      en: "Your clothes professionally cleaned and pressed.",
    },
    fromPriceCents: null,
    isActive: true,
    sortOrder: 9,
  },
  {
    id: OTHER_SERVICE_ID,
    name: { nl: "Overig", tr: "Diğer", en: "Other" },
    description: {
      nl: "Iets anders? Vraag het ons.",
      tr: "Başka bir şey mi? Bize sorun.",
      en: "Something else? Just ask us.",
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
