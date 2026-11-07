import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { NewOrderButton } from "@/components/admin/NewOrderButton";
import { OrderCard } from "@/components/admin/OrderCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { initPageLocale } from "@/i18n/page-locale";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { todayInShop } from "@/lib/order-utils";
import { searchOrders } from "@/lib/orders";
import { getAllServices } from "@/lib/services";
import { ORDER_STATUSES, type OrderStatus } from "@/types/order";

const MAX_QUERY_LENGTH = 100;

type SearchParams = PageProps<"/[locale]/admin/orders">["searchParams"];

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/orders">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Orders" });
  return { title: t("title") };
}

export default async function OrdersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/orders">) {
  await initPageLocale(params);
  const t = await getTranslations("Orders");
  const tDashboard = await getTranslations("Dashboard");

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <NewOrderButton />
      </div>
      {/* The search terms come from the URL (?q=...&status=...), only known at request time. */}
      <Suspense fallback={<p className="text-lg text-muted">{tDashboard("loading")}</p>}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrdersContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const t = await getTranslations("Orders");
  const tStatus = await getTranslations("Status");

  // Validate URL input on the server: unknown values are ignored.
  const { q, status: rawStatus } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, MAX_QUERY_LENGTH) : "";
  const status = ORDER_STATUSES.find((value) => value === rawStatus);

  const [orders, services] = await Promise.all([
    searchOrders({ query, status }),
    getAllServices(),
  ]);
  const today = todayInShop();

  // Builds a filter link that keeps the current search text.
  const filterHref = (filterStatus?: OrderStatus) => ({
    pathname: "/admin/orders",
    query: {
      ...(query && { q: query }),
      ...(filterStatus && { status: filterStatus }),
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* A normal GET form: submitting puts ?q=... in the URL. Works without JavaScript. */}
      <form role="search" className="flex flex-col gap-2">
        <label htmlFor="q" className="font-semibold">
          {t("searchLabel")}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input id="q" type="search" name="q" defaultValue={query} maxLength={MAX_QUERY_LENGTH} />
          {status && <input type="hidden" name="status" value={status} />}
          <Button type="submit">{t("search")}</Button>
        </div>
        {query && (
          <Link href={filterHref(status)} className="self-start text-primary underline">
            {t("clearSearch")}
          </Link>
        )}
      </form>

      <nav aria-label={t("filterLabel")}>
        <ul className="flex flex-wrap gap-2">
          {[undefined, ...ORDER_STATUSES].map((filterStatus) => {
            const isActive = filterStatus === status;
            return (
              <li key={filterStatus ?? "all"}>
                <Link
                  href={filterHref(filterStatus)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-full border-2 px-4 font-semibold ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface hover:border-primary"
                  }`}
                >
                  {filterStatus ? tStatus(filterStatus) : t("all")}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="font-semibold" role="status">
        {t("resultCount", { count: orders.length })}
      </p>

      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            service={services.find((service) => service.id === order.serviceId)}
            today={today}
            showMissing
          />
        ))}
      </div>
    </div>
  );
}
