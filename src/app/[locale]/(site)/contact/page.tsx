import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OpeningHoursList } from "@/components/public/OpeningHoursList";
import { PageHero } from "@/components/public/PageHero";
import { SocialLinks } from "@/components/public/SocialLinks";
import { ExternalButtonLink } from "@/components/ui/ButtonLink";
import { initPageLocale } from "@/i18n/page-locale";
import { shop, shopAddressLine, shopMapsUrl, shopWhatsAppUrl } from "@/lib/shop";
import { siteImages } from "@/lib/site-images";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Contact" });
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  await initPageLocale(params);
  const t = await getTranslations("Contact");
  const tCommon = await getTranslations("Common");
  const tSocial = await getTranslations("Social");

  return (
    <>
      <PageHero image={siteImages.contact} eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-16 lg:grid-cols-2">
        <div className="reveal flex flex-col gap-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <ExternalButtonLink href={`tel:${shop.phone}`}>{tCommon("callUs")}</ExternalButtonLink>
            <ExternalButtonLink href={shopWhatsAppUrl()} target="_blank" rel="noopener noreferrer" variant="secondary">
              {tCommon("whatsappUs")}
            </ExternalButtonLink>
          </div>

          <dl className="flex flex-col gap-6">
            <div>
              <dt className="text-sm font-semibold tracking-[0.2em] text-accent-strong uppercase">{t("address")}</dt>
              <dd className="mt-1 text-lg">
                <strong>{shop.fullName}</strong>
                <br />
                {shopAddressLine()}
                <br />
                {/* A link instead of an embedded map: no third-party cookies, no consent banner needed. */}
                <a href={shopMapsUrl()} target="_blank" rel="noopener noreferrer" className="text-accent-strong underline underline-offset-4">
                  {t("openInMaps")}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold tracking-[0.2em] text-accent-strong uppercase">{t("phone")}</dt>
              <dd className="mt-1">
                <a href={`tel:${shop.phone}`} className="text-2xl font-semibold">
                  {shop.phoneDisplay}
                </a>
              </dd>
            </div>
          </dl>

          <section className="flex flex-col gap-3">
            <h2 className="text-2xl">{tSocial("title")}</h2>
            <SocialLinks withLabels />
          </section>
        </div>

        <section className="reveal self-start rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-8">
          <h2 className="mb-4 text-2xl">{t("openingHours")}</h2>
          <OpeningHoursList />
        </section>
      </div>
    </>
  );
}
