import { useTranslations } from "next-intl";
import type { MissingField } from "@/types/order";

export function MissingFieldChips({ fields }: { fields: MissingField[] }) {
  const t = useTranslations("MissingField");

  return (
    <span className="flex flex-wrap gap-2">
      {fields.map((field) => (
        <span
          key={field}
          className="rounded-full border border-dashed border-muted px-2 py-0.5 text-sm"
        >
          {t(field)}
        </span>
      ))}
    </span>
  );
}
