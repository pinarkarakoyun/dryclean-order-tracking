import type { Metadata } from "next";
import { Suspense } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { initPageLocale } from "@/i18n/page-locale";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { filterCustomers, sortCustomers } from "@/lib/customer-search";
import { listCustomers } from "@/lib/customers";
import { formatPhone } from "@/lib/phone";

const MAX_QUERY_LENGTH = 100;

type SearchParams = PageProps<"/[locale]/admin/customers">["searchParams"];

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/customers">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Customers" });
  return { title: t("title") };
}

export default async function CustomersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/customers">) {
  await initPageLocale(params);
  const t = await getTranslations("Customers");
  const tDashboard = await getTranslations("Dashboard");

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>
      {/* The search text comes from the URL (?q=...), only known at request time. */}
      <Suspense fallback={<p className="text-lg text-muted">{tDashboard("loading")}</p>}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function CustomersContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const t = await getTranslations("Customers");
  const format = await getFormatter();

  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, MAX_QUERY_LENGTH) : "";
  const customers = sortCustomers(filterCustomers(await listCustomers(), query));

  return (
    <div className="flex flex-col gap-6">
      {/* A normal GET form: submitting puts ?q=... in the URL. Works without JavaScript. */}
      <form role="search" className="flex flex-col gap-2">
        <label htmlFor="q" className="font-semibold">
          {t("searchLabel")}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input id="q" type="search" name="q" defaultValue={query} maxLength={MAX_QUERY_LENGTH} />
          <Button type="submit">{t("search")}</Button>
        </div>
        {query && (
          <Link href="/admin/customers" className="self-start text-primary underline">
            {t("clearSearch")}
          </Link>
        )}
      </form>

      <p className="font-semibold" role="status">
        {customers.length === 0 ? t("noResults") : t("resultCount", { count: customers.length })}
      </p>

      <ul className="flex flex-col gap-3">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link
              href={`/admin/customers/${customer.id}`}
              className="flex flex-col gap-1 rounded-xl border-2 border-border bg-surface p-4 hover:border-primary"
            >
              <span className="text-xl font-bold">{customer.name}</span>
              <span className="text-lg">{formatPhone(customer.phone)}</span>
              <span className="text-muted">
                {customer.lastOrderAt
                  ? t("orderSummary", {
                      count: customer.orderCount,
                      date: format.dateTime(new Date(customer.lastOrderAt), "date"),
                    })
                  : t("noOrdersYet")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
