import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HowItWorksSteps } from "@/components/public/HowItWorksSteps";
import { PageHero } from "@/components/public/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { initPageLocale } from "@/i18n/page-locale";
import { isOrderTrackingEnabled } from "@/lib/features";
import { siteImages } from "@/lib/site-images";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "HowItWorks" });
  return { title: t("title") };
}

export default async function HowItWorksPage({
  params,
}: PageProps<"/[locale]/how-it-works">) {
  await initPageLocale(params);
  const t = await getTranslations("HowItWorks");
  const tTrack = await getTranslations("Track");
  const trackingEnabled = isOrderTrackingEnabled();

  return (
    <>
      <PageHero
        image={siteImages.about}
        eyebrow={t("eyebrow")}
        title={t("title")}
        intro={trackingEnabled ? t("intro") : t("introSimple")}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16">
        <HowItWorksSteps withTracking={trackingEnabled} />
        {trackingEnabled && (
          <ButtonLink href="/track" className="self-start">
            {tTrack("cta")}
          </ButtonLink>
        )}
      </div>
    </>
  );
}
