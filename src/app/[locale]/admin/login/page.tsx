import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/admin/LoginForm";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { initPageLocale } from "@/i18n/page-locale";
import { shop } from "@/lib/shop";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/login">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "AdminLogin" });
  return { title: t("title") };
}

export default async function LoginPage({
  params,
}: PageProps<"/[locale]/admin/login">) {
  await initPageLocale(params);
  const t = await getTranslations("AdminLogin");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-accent-strong">{shop.fullName}</p>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted">{t("intro")}</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
