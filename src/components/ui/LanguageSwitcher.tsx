"use client";

import { Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames } from "@/i18n/locale-names";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");

  return (
    <nav aria-label={t("label")} className="flex gap-1">
      {/* The current path is only known at request time on dynamic pages.
          Until then, the links point to the home page in each language. */}
      <Suspense fallback={<LocaleLinks pathname="/" />}>
        <CurrentPageLocaleLinks />
      </Suspense>
    </nav>
  );
}

function CurrentPageLocaleLinks() {
  // Current page without the language prefix, e.g. "/contact".
  const pathname = usePathname();
  return <LocaleLinks pathname={pathname} />;
}

function LocaleLinks({ pathname }: { pathname: string }) {
  const currentLocale = useLocale();

  return routing.locales.map((locale) => {
    const isActive = locale === currentLocale;
    return (
      <Link
        key={locale}
        href={pathname}
        locale={locale}
        lang={locale}
        aria-label={localeNames[locale]}
        aria-current={isActive ? "true" : undefined}
        className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-base font-semibold uppercase ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-primary hover:bg-border/40"
        }`}
      >
        {locale}
      </Link>
    );
  });
}
