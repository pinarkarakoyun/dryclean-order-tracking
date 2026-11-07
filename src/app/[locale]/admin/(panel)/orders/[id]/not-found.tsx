"use client";

import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";

// Shown when notFound() is called in the order detail page (unknown order id).
// A client component on purpose: not-found pages get no `params`, so on the server
// next-intl could not know the language. In the browser it is read from the
// NextIntlClientProvider in the root layout.
export default function OrderNotFound() {
  const t = useTranslations("OrderDetail");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{t("notFoundTitle")}</h1>
      <p className="text-lg text-muted">{t("notFoundText")}</p>
      <ButtonLink href="/admin/orders" variant="secondary" className="self-start">
        {t("backToOrders")}
      </ButtonLink>
    </div>
  );
}
