import { shop } from "@/lib/shop";

/**
 * Text logo in the style of the shop sign: "Mustan" in Vidaloka with the
 * tagline in small capitals. Text (not an image) stays sharp and translatable.
 */
export function ShopLogo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className={`font-display text-3xl ${inverted ? "text-background" : "text-foreground"}`}>
        {shop.name}
      </span>
      {/* lang="nl": a Dutch name. On Turkish pages, uppercase would otherwise turn "i" into "İ". */}
      <span
        lang="nl"
        className={`mt-1 text-[0.6rem] font-semibold tracking-[0.12em] whitespace-nowrap uppercase sm:text-[0.65rem] sm:tracking-[0.18em] ${
          inverted ? "text-accent" : "text-accent-strong"
        }`}
      >
        {shop.tagline}
      </span>
    </span>
  );
}
