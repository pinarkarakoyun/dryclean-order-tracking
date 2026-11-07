import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";

/** The most used action in the shop, so it is big and at the top of the main pages. */
export function NewOrderButton() {
  const t = useTranslations("Admin");

  return (
    <ButtonLink href="/admin/orders/new" className="w-full sm:w-auto">
      <span aria-hidden="true" className="mr-2 text-2xl leading-none">
        +
      </span>
      {t("newOrder")}
    </ButtonLink>
  );
}
