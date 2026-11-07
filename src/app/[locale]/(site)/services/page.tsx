import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/public/PageHero";
import { ServiceGrid } from "@/components/public/ServiceGrid";
import { ExternalButtonLink } from "@/components/ui/ButtonLink";
import { initPageLocale } from "@/i18n/page-locale";
import { getActiveServices, OTHER_SERVICE_ID } from "@/lib/services";
import { shopWhatsAppUrl } from "@/lib/shop";
import { getServiceImage } from "@/lib/site-images";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Services" });
  return { title: t("title") };
}

export default async function ServicesPage({
  params,
}: PageProps<"/[locale]/services">) {
  await initPageLocale(params);
  const t = await getTranslations("Services");
  const tCommon = await getTranslations("Common");
  const services = (await getActiveServices()).filter(
    (service) => service.id !== OTHER_SERVICE_ID,
  );

  return (
    <>
      <PageHero
        image={getServiceImage("jacket-alteration")}
        eyebrow={t("eyebrow")}
        title={t("title")}
        intro={t("intro")}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-14 px-4 py-16">
        <ServiceGrid services={services} showPrices />

        <section className="reveal flex flex-col items-start gap-4 rounded-2xl bg-primary p-8 text-background sm:p-10">
          <h2 className="text-3xl">{t("otherTitle")}</h2>
          <p className="max-w-xl text-lg text-background/85">{t("otherText")}</p>
          <ExternalButtonLink href={shopWhatsAppUrl()} target="_blank" rel="noopener noreferrer" variant="light">
            {tCommon("whatsappUs")}
          </ExternalButtonLink>
        </section>
      </div>
    </>
  );
}
