import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HowItWorksSteps } from "@/components/public/HowItWorksSteps";
import { OpeningHoursList } from "@/components/public/OpeningHoursList";
import { PartnerLogos } from "@/components/public/PartnerLogos";
import { SectionHeading } from "@/components/public/SectionHeading";
import { ServiceGrid } from "@/components/public/ServiceGrid";
import { SocialLinks } from "@/components/public/SocialLinks";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/ButtonLink";
import { initPageLocale } from "@/i18n/page-locale";
import { isOrderTrackingEnabled } from "@/lib/features";
import { getActiveServices, OTHER_SERVICE_ID } from "@/lib/services";
import { shop, shopAddressLine, shopMapsUrl, shopWhatsAppUrl } from "@/lib/shop";
import { siteImages } from "@/lib/site-images";

/** Number of service cards on the home page; the services page shows all. */
const FEATURED_SERVICES = 6;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  await initPageLocale(params);
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");
  const tContact = await getTranslations("Contact");
  const tTrack = await getTranslations("Track");
  const services = (await getActiveServices())
    .filter((service) => service.id !== OTHER_SERVICE_ID)
    .slice(0, FEATURED_SERVICES);
  const years = shop.yearsOfExperience;
  const trackingEnabled = isOrderTrackingEnabled();
  const highlights = (
    [
      ["highlight1Title", "highlight1Text"],
      ["highlight2Title", "highlight2Text"],
      ["highlight3Title", "highlight3Text"],
    ] as const
  ).filter(([title]) => trackingEnabled || title !== "highlight3Title");

  return (
    <>
      {/* Hero: large photo with the main message and the two most important actions. */}
      <section className="relative isolate overflow-hidden bg-primary">
        <Image
          src={siteImages.hero}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="-z-10 object-cover opacity-60"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/95 via-primary/70 to-primary/20" />
        <div className="animate-fade-up mx-auto flex min-h-[78vh] max-w-5xl flex-col justify-center gap-6 px-4 py-20">
          <p className="text-sm font-semibold tracking-[0.25em] text-accent uppercase">{t("heroEyebrow")}</p>
          <h1 className="max-w-2xl text-5xl leading-[1.05] text-background sm:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-lg text-background/90 sm:text-xl">{t("intro")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {trackingEnabled && (
              <ButtonLink href="/track" variant="light">
                {tTrack("cta")}
              </ButtonLink>
            )}
            {/* The only button when the order module is off: then it gets the filled style. */}
            <ExternalButtonLink
              href={shopWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              variant={trackingEnabled ? "outlineLight" : "light"}
            >
              {tCommon("whatsappUs")}
            </ExternalButtonLink>
          </div>
        </div>
      </section>

      {/* Short reasons to choose the shop (the third one only with online tracking). */}
      <section className="border-b border-border bg-sand">
        <ul
          className={`mx-auto grid max-w-5xl gap-6 px-4 py-10 ${
            trackingEnabled ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          {highlights.map(([title, text]) => (
            <li key={title} className="reveal flex flex-col gap-1 border-l-2 border-accent pl-4">
              <p className="font-display text-2xl">{t(title, { years })}</p>
              <p className="text-muted">{t(text)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-20">
        <SectionHeading eyebrow={t("servicesEyebrow")} title={t("servicesTitle")} />
        <ServiceGrid services={services} />
        <ButtonLink href="/services" variant="secondary" className="self-start">
          {t("allServices")}
        </ButtonLink>
      </section>

      {/* About: photo next to the text on large screens. */}
      <section className="bg-primary">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <div className="reveal relative aspect-[4/5] overflow-hidden rounded-2xl">
            <Image
              src={siteImages.about}
              alt=""
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="reveal flex flex-col gap-6">
            <SectionHeading eyebrow={t("aboutEyebrow")} title={t("aboutTitle")} inverted />
            <p className="text-lg text-background/85">{t("aboutText", { years })}</p>
            <p className="font-display text-6xl text-accent">
              {years}
              <span className="ml-3 align-middle font-sans text-base font-semibold tracking-[0.2em] text-background uppercase">
                {t("experienceLabel")}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-20">
        <SectionHeading eyebrow={t("howItWorksEyebrow")} title={t("howItWorksTitle")} />
        <HowItWorksSteps withTracking={trackingEnabled} />
      </section>

      <section className="bg-sand">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-20">
          <SectionHeading
            eyebrow={t("partnersEyebrow")}
            title={t("partnersTitle")}
            intro={t("partnersText")}
            align="center"
          />
          <PartnerLogos />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-20 lg:grid-cols-2">
        <div className="reveal flex flex-col gap-6">
          <SectionHeading eyebrow={t("visitEyebrow")} title={t("visitTitle")} />
          <p className="text-lg">
            <strong>{shop.fullName}</strong>
            <br />
            {shopAddressLine()}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ExternalButtonLink href={`tel:${shop.phone}`}>{tCommon("callUs")}</ExternalButtonLink>
            <ExternalButtonLink href={shopMapsUrl()} target="_blank" rel="noopener noreferrer" variant="secondary">
              {tContact("openInMaps")}
            </ExternalButtonLink>
          </div>
          <SocialLinks withLabels />
        </div>
        <div className="reveal rounded-2xl bg-surface p-6 ring-1 ring-border">
          <h3 className="mb-3 font-display text-2xl">{tContact("openingHours")}</h3>
          <OpeningHoursList />
        </div>
      </section>
    </>
  );
}
