"use client";

import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";

// Shown when notFound() is called for an unknown product id. A client component on purpose:
// not-found pages get no `params`, so the language comes from the NextIntlClientProvider.
export default function ProductNotFound() {
  const t = useTranslations("ProductNotFound");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-lg text-muted">{t("text")}</p>
      <ButtonLink href="/admin/products" variant="secondary" className="self-start">
        {t("back")}
      </ButtonLink>
    </div>
  );
}
