import { useTranslations } from "next-intl";
import { shop, shopAddressLine, shopMapsUrl } from "@/lib/shop";
import { ShopLogo } from "./ShopLogo";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tContact = useTranslations("Contact");
  const tSocial = useTranslations("Social");

  return (
    <footer className="mt-auto bg-primary text-background">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:grid-cols-2">
        <div className="flex flex-col gap-5">
          <ShopLogo inverted />
          <div className="flex flex-col gap-3">
            <p className="font-semibold">{tSocial("title")}</p>
            <SocialLinks tone="dark" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-display text-xl">{t("visit")}</p>
          <p className="text-background/85">{shopAddressLine()}</p>
          <a href={shopMapsUrl()} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
            {tContact("openInMaps")}
          </a>
          <a href={`tel:${shop.phone}`} className="mt-2 text-lg font-semibold">
            {shop.phoneDisplay}
          </a>
        </div>
      </div>
      <div className="border-t border-background/15">
        <p className="mx-auto max-w-5xl px-4 py-5 text-sm text-background/70">© {shop.fullName}</p>
      </div>
    </footer>
  );
}
