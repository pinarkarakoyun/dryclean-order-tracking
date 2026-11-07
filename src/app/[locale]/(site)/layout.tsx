import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { initPageLocale } from "@/i18n/page-locale";

// Layout for the public website. "(site)" is a route group: it is not part of the URL.
// Pages set their own width, so photo sections can use the full screen width.
export default async function SiteLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  await initPageLocale(params);

  return (
    <>
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
