import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { getServiceImage } from "@/lib/site-images";
import type { Service } from "@/types/service";

type ServiceGridProps = {
  services: Service[];
  showPrices?: boolean;
};

/** Photo cards for services, like on the current website. */
export function ServiceGrid({ services, showPrices = false }: ServiceGridProps) {
  const t = useTranslations("Common");
  const format = useFormatter();
  const locale = useLocale();

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <li
          key={service.id}
          className="reveal group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-border transition-shadow hover:shadow-lg"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={getServiceImage(service.id)}
              alt=""
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-5">
            <h3 className="font-display text-2xl">{service.name[locale]}</h3>
            <p className="text-muted">{service.description[locale]}</p>
            {showPrices && (
              <p className="mt-auto pt-2 font-semibold text-accent-strong">
                {service.fromPriceCents === null
                  ? t("priceOnRequest")
                  : t("priceFrom", {
                      price: format.number(service.fromPriceCents / 100, "price"),
                    })}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
