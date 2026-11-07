import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NewOrderForm } from "@/components/admin/NewOrderForm";
import { initPageLocale } from "@/i18n/page-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/orders/new">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "NewOrder" });
  return { title: t("title") };
}

// The form itself contains no data, so this page is pre-rendered.
// The login is checked by src/proxy.ts and again inside the server action.
export default async function NewOrderPage({
  params,
}: PageProps<"/[locale]/admin/orders/new">) {
  await initPageLocale(params);
  const t = await getTranslations("NewOrder");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-lg text-muted">{t("intro")}</p>
      </div>
      <NewOrderForm />
    </div>
  );
}
