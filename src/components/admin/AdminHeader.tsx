import { useTranslations } from "next-intl";
import { logout } from "@/app/[locale]/admin/actions";
import { ShopLogo } from "@/components/public/ShopLogo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NavLink } from "@/components/ui/NavLink";
import { Link } from "@/i18n/navigation";

export function AdminHeader() {
  const t = useTranslations("Admin");

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/admin" className="flex flex-wrap items-center gap-2">
            <ShopLogo />
            <span className="rounded-full bg-primary px-2 py-0.5 text-sm font-semibold text-primary-foreground">
              {t("panelName")}
            </span>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav aria-label={t("panelName")}>
            <ul className="-mx-3 flex flex-wrap">
              <li>
                <NavLink href="/admin" exact>
                  {t("dashboard")}
                </NavLink>
              </li>
              <li>
                <NavLink href="/admin/orders">{t("orders")}</NavLink>
              </li>
            </ul>
          </nav>
          {/* A form, so logging out works even without JavaScript. */}
          <form action={logout}>
            <button
              type="submit"
              className="min-h-11 rounded-lg px-3 font-semibold text-primary underline underline-offset-4 hover:bg-border/40"
            >
              {t("logout")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
