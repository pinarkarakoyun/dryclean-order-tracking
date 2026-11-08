"use client";

import { useTranslations } from "next-intl";
import { PageIntro } from "@/components/public/PageIntro";

// Shown when a public page calls notFound() (e.g. an unknown tracking token).
// A client component on purpose: not-found pages get no `params`, so on the server
// next-intl could not know the language. In the browser it is read from the
// NextIntlClientProvider in the root layout.
export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <PageIntro title={t("title")} intro={t("text")} />
    </div>
  );
}
