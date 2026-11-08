import { ShopLogo } from "./ShopLogo";

export function SiteHeader() {
  return (
    <header className="z-30 border-b border-border bg-background/90 backdrop-blur lg:sticky lg:top-0">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <ShopLogo />
      </div>
    </header>
  );
}
