import type { StaticImageData } from "next/image";
import about from "@/assets/images/about.jpg";
import contact from "@/assets/images/contact.jpg";
import hero from "@/assets/images/hero.jpg";
import downJacketRepair from "@/assets/images/service-down-jacket-repair.jpg";
import dryCleaning from "@/assets/images/service-dry-cleaning.jpg";
import generalRepair from "@/assets/images/service-general-repair.jpg";
import jacketAlteration from "@/assets/images/service-jacket-alteration.jpg";
import leatherRepair from "@/assets/images/service-leather-repair.jpg";
import other from "@/assets/images/service-other.jpg";
import sleeveShortening from "@/assets/images/service-sleeve-shortening.jpg";
import trouserHem from "@/assets/images/service-trouser-hem.jpg";
import waistAdjustment from "@/assets/images/service-waist-adjustment.jpg";
import zipperReplacement from "@/assets/images/service-zipper-replacement.jpg";

// All photos of the public site in one place. They are temporary stock photos
// (see src/assets/images/CREDITS.md): replace a file with the owner's photo
// using the same name, and the site uses it automatically.
// Static imports let Next.js resize the photos and show a blurred preview while loading.

export const siteImages = { hero, about, contact };

const serviceImages: Record<string, StaticImageData> = {
  "trouser-hem": trouserHem,
  "sleeve-shortening": sleeveShortening,
  "waist-adjustment": waistAdjustment,
  "zipper-replacement": zipperReplacement,
  "jacket-alteration": jacketAlteration,
  "general-repair": generalRepair,
  "leather-repair": leatherRepair,
  "down-jacket-repair": downJacketRepair,
  "dry-cleaning": dryCleaning,
  other,
};

/** Photo for a service card; services added later fall back to a general photo. */
export function getServiceImage(serviceId: string): StaticImageData {
  return serviceImages[serviceId] ?? other;
}
