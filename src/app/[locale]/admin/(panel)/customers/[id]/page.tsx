import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DetailRow, DetailSection, Notice } from "@/components/admin/Detail";
import { OrderCard } from "@/components/admin/OrderCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import { initPageLocale } from "@/i18n/page-locale";
import { requireAdmin } from "@/lib/auth";
import { getCustomer } from "@/lib/customers";
import { todayInShop } from "@/lib/order-utils";
import { listOrdersForCustomer } from "@/lib/orders";
import { formatPhone } from "@/lib/phone";

// The customer id is only known at request time; loading.tsx shows a placeholder meanwhile.
export default async function CustomerPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/customers/[id]">) {
  await initPageLocale(params);
  await requireAdmin();
  const { id } = await params;
  const { notice } = await searchParams;

  const customer = await getCustomer(id);
  if (!customer) notFound();
  const orders = await listOrdersForCustomer(customer.id);
  const today = todayInShop();

  const t = await getTranslations("Customers");

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/customers" className="self-start font-semibold text-primary underline">
        ← {t("title")}
      </Link>

      {notice === "saved" && <Notice title={t("noticeSaved")} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">{customer.name}</h1>
        <ButtonLink href={`/admin/customers/${customer.id}/edit`} variant="secondary">
          {t("edit")}
        </ButtonLink>
      </div>

      <DetailSection title={t("details")}>
        <DetailRow label={t("phone")}>
          <a href={`tel:${customer.phone}`} className="font-medium underline">
            {formatPhone(customer.phone)}
          </a>
        </DetailRow>
        {customer.preferenceNote && (
          <DetailRow label={t("preferenceNote")}>{customer.preferenceNote}</DetailRow>
        )}
      </DetailSection>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t("orders")}</h2>
        {orders.length === 0 ? (
          <p className="text-lg text-muted">{t("noOrdersYet")}</p>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} today={today} showMissing />)
        )}
      </section>
    </div>
  );
}
