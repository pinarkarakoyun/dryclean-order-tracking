import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { PageIntro } from "@/components/public/PageIntro";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getClientMessages, PUBLIC_CLIENT_NAMESPACES } from "@/i18n/client-messages";
import { NOT_FOUND_LOCALE_HEADER, parseNotFoundLocale } from "@/i18n/not-found-locale";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "404",
};

// Rendered on each request (not pre-rendered), because the language is only
// known from the requested URL. Fine for a small, rarely visited page.
export const instant = false;

// Shown for URLs that match no page at all (e.g. /tr/abc).
// It bypasses all layouts, so it renders its own <html> and site header.
export default async function GlobalNotFound() {
  // A turned-off order module page (/tr/admin, /tr/track, ...) is sent here by
  // src/proxy.ts with the language in a header. Otherwise the language comes from
  // the URL prefix, resolved by the language routing.
  const headerLocale = parseNotFoundLocale((await headers()).get(NOT_FOUND_LOCALE_HEADER));
  if (headerLocale) setRequestLocale(headerLocale);
  const locale = await getLocale();
  const t = await getTranslations("NotFound");
  const tCommon = await getTranslations("Common");

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider messages={await getClientMessages(PUBLIC_CLIENT_NAMESPACES)}>
          <SiteHeader />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
            <PageIntro title={t("title")} intro={t("text")} />
            <ButtonLink href="/">{tCommon("backHome")}</ButtonLink>
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
