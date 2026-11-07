import { useTranslations } from "next-intl";
import { SocialIcon } from "@/components/ui/SocialIcon";
import type { SocialNetwork } from "@/components/ui/social-icon-paths";
import { shop, shopWhatsAppUrl } from "@/lib/shop";

const links: { network: SocialNetwork; href: () => string }[] = [
  { network: "whatsapp", href: shopWhatsAppUrl },
  { network: "facebook", href: () => shop.social.facebook },
  { network: "instagram", href: () => shop.social.instagram },
];

type SocialLinksProps = {
  /** "dark" for the footer (light text), "light" for normal pages. */
  tone?: "light" | "dark";
  /** Show the network name next to the icon (bigger buttons, e.g. on the contact page). */
  withLabels?: boolean;
};

/** WhatsApp, Facebook and Instagram buttons. */
export function SocialLinks({ tone = "light", withLabels = false }: SocialLinksProps) {
  const t = useTranslations("Social");
  const toneClasses =
    tone === "dark"
      ? "border-background/30 text-background hover:bg-background hover:text-foreground"
      : "border-border bg-surface text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground";

  return (
    <ul className="flex flex-wrap gap-3">
      {links.map(({ network, href }) => (
        <li key={network}>
          <a
            href={href()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(network)}
            className={`flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border-2 transition-colors ${
              withLabels ? "px-5 font-semibold" : ""
            } ${toneClasses}`}
          >
            <SocialIcon network={network} className="size-5" />
            {withLabels && <span>{t(network)}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
