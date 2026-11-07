import { useTranslations } from "next-intl";
import { shop } from "@/lib/shop";

export function OpeningHoursList() {
  const tDays = useTranslations("Days");
  const t = useTranslations("Contact");

  return (
    <dl className="flex flex-col">
      {shop.openingHours.map(({ day, hours }) => (
        <div
          key={day}
          className="flex justify-between gap-4 border-b border-border py-2 last:border-b-0"
        >
          <dt>{tDays(day)}</dt>
          <dd className={hours ? "font-medium" : "text-muted"}>
            {hours
              ? t("hoursRange", { open: hours.open, close: hours.close })
              : t("closed")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
