import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageIntro } from "@/components/public/PageIntro";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { initPageLocale } from "@/i18n/page-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/track">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Track" });
  return { title: t("title") };
}

// Explains how to track an order. There is deliberately no "enter your order number"
// form: order numbers are guessable, so tracking only works via the secret QR link (PRD §8).
export default async function TrackInfoPage({
  params,
}: PageProps<"/[locale]/track">) {
  await initPageLocale(params);
  const t = await getTranslations("Track");
  const tNav = await getTranslations("Nav");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <PageIntro eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <ol className="mb-8 flex list-decimal flex-col gap-3 pl-6 text-lg">
        <li>{t("optionQr")}</li>
        <li>{t("optionLink")}</li>
      </ol>
      <p className="mb-6 text-muted">{t("noCode")}</p>
      <ButtonLink href="/contact" variant="secondary">
        {tNav("contact")}
      </ButtonLink>
    </div>
  );
}
