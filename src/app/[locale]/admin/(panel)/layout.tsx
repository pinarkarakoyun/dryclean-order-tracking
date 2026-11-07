import { AdminHeader } from "@/components/admin/AdminHeader";
import { initPageLocale } from "@/i18n/page-locale";

// Layout for all admin pages after login. "(panel)" is a route group: not part of the URL.
// The login check itself is in src/proxy.ts and in requireAdmin() next to the data.
export default async function PanelLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  await initPageLocale(params);

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
