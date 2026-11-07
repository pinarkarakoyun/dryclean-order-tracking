import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { ADMIN_CLIENT_NAMESPACES, getClientMessages } from "@/i18n/client-messages";
import { initPageLocale } from "@/i18n/page-locale";
import { isOrderTrackingEnabled } from "@/lib/features";

// The admin panel must never appear in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Gives the admin client components (forms) their texts.
// This replaces the public messages from the root layout inside /admin.
export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  // Second check after src/proxy.ts: the admin panel belongs to the order module.
  if (!isOrderTrackingEnabled()) notFound();
  await initPageLocale(params);

  return (
    <NextIntlClientProvider messages={await getClientMessages(ADMIN_CLIENT_NAMESPACES)}>
      {children}
    </NextIntlClientProvider>
  );
}
