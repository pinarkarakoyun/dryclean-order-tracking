import Image from "next/image";
import { partners, type Partner } from "@/lib/partners";

/** Logos of the shops the owner works for. A logo links to the shop's site once it is known. */
export function PartnerLogos() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {partners.map((partner) => (
        <li key={partner.name} className="reveal">
          {partner.website ? (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={partner.name}
              className="group flex h-28 items-center justify-center rounded-2xl bg-surface p-5 ring-1 ring-border transition-shadow hover:shadow-md focus-visible:outline-4 focus-visible:outline-primary"
            >
              <PartnerLogo partner={partner} />
            </a>
          ) : (
            <div className="group flex h-28 items-center justify-center rounded-2xl bg-surface p-5 ring-1 ring-border">
              <PartnerLogo partner={partner} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function PartnerLogo({ partner }: { partner: Partner }) {
  return (
    <Image
      src={partner.logo}
      alt={partner.name}
      className="max-h-16 w-auto object-contain grayscale transition duration-300 group-hover:grayscale-0"
    />
  );
}
