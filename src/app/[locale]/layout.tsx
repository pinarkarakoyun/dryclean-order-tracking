import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getClientMessages, PUBLIC_CLIENT_NAMESPACES } from "@/i18n/client-messages";
import { initPageLocale } from "@/i18n/page-locale";
import { routing } from "@/i18n/routing";
import { isOrderTrackingEnabled } from "@/lib/features";
import { shop } from "@/lib/shop";
import { fontVariables } from "../fonts";
import "../globals.css";

// Pre-render every page once per language at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: { default: shop.fullName, template: `%s | ${shop.fullName}` },
    // "Track your order online" only when the order module is on.
    description: isOrderTrackingEnabled()
      ? `${t("description")} ${t("descriptionTracking")}`
      : t("description"),
  };
}

// Root layout: shared by the public site and (later) the admin panel.
export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await initPageLocale(params);

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {/* Makes translations available in client components ("use client"), only the public ones. */}
        <NextIntlClientProvider messages={await getClientMessages(PUBLIC_CLIENT_NAMESPACES)}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
