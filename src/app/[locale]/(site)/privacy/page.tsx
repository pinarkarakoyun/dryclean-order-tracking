import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageIntro } from "@/components/public/PageIntro";
import { initPageLocale } from "@/i18n/page-locale";
import { isOrderTrackingEnabled } from "@/lib/features";
import { shop, shopAddressLine } from "@/lib/shop";

// Order module on: the shop stores order data, and customers have a tracking page.
const sectionsWithOrders = [
  { title: "collectTitle", text: "collectText" },
  { title: "purposeTitle", text: "purposeText" },
  { title: "trackingTitle", text: "trackingText" },
  { title: "rightsTitle", text: "rightsText" },
] as const;

// Order module off: the website stores no order data, so only what still applies.
const simpleSections = [
  { title: "simpleDataTitle", text: "simpleDataText" },
  { title: "simpleCookiesTitle", text: "simpleCookiesText" },
  { title: "simpleLinksTitle", text: "simpleLinksText" },
  { title: "simpleContactTitle", text: "simpleContactText" },
] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return { title: t("title") };
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  await initPageLocale(params);
  const t = await getTranslations("Privacy");
  const trackingEnabled = isOrderTrackingEnabled();
  const sections = trackingEnabled ? sectionsWithOrders : simpleSections;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <PageIntro title={t("title")} intro={trackingEnabled ? t("intro") : t("introSimple")} />
      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="text-2xl">{t(section.title)}</h2>
            <p>{t(section.text)}</p>
          </section>
        ))}
        <p className="text-muted">
          {shop.fullName} · {shopAddressLine()} · {shop.phoneDisplay}
        </p>
      </div>
    </div>
  );
}
