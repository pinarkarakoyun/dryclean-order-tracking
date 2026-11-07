import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NavLink } from "@/components/ui/NavLink";
import { Link } from "@/i18n/navigation";
import { ShopLogo } from "./ShopLogo";

export function SiteHeader() {
  const t = useTranslations("Nav");

  return (
    // Sticky on large screens only: on phones the menu takes two lines and would
    // cover too much of the screen while scrolling.
    <header className="z-30 border-b border-border bg-background/90 backdrop-blur lg:sticky lg:top-0">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label={t("home")}>
            <ShopLogo />
          </Link>
          <div className="lg:hidden">
            <LanguageSwitcher />
          </div>
        </div>

        {/* No hamburger menu: four links fit and stay visible, which is easier for older users. */}
        <div className="flex items-center gap-4">
          <nav aria-label={t("mainMenu")}>
            <ul className="-mx-3 flex flex-wrap">
              <li>
                <NavLink href="/">{t("home")}</NavLink>
              </li>
              <li>
                <NavLink href="/services">{t("services")}</NavLink>
              </li>
              <li>
                <NavLink href="/how-it-works">{t("howItWorks")}</NavLink>
              </li>
              <li>
                <NavLink href="/contact">{t("contact")}</NavLink>
              </li>
            </ul>
          </nav>
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
