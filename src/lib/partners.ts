import type { StaticImageData } from "next/image";
import oosterhoff from "@/assets/images/partner-oosterhoff.png";
import perLui from "@/assets/images/partner-per-lui.png";
import robertMode from "@/assets/images/partner-robert-mode.png";
import schoneZaken from "@/assets/images/partner-schone-zaken.png";
import vic from "@/assets/images/partner-vic.png";

export type Partner = {
  name: string;
  logo: StaticImageData;
  /** The shop's own website. null = not known yet: the logo is shown without a link. */
  website: string | null;
};

// Shops the owner works for (from the current website).
// TODO (owner): confirm we may show the logos, and send each shop's website.
export const partners: Partner[] = [
  { name: "Oosterhoff Mannenmode", logo: oosterhoff, website: null },
  { name: "Robert Mode Haren", logo: robertMode, website: null },
  { name: "Schone Zaken", logo: schoneZaken, website: null },
  { name: "Per Lui", logo: perLui, website: null },
  { name: "Vic Fashion for Men", logo: vic, website: null },
];
