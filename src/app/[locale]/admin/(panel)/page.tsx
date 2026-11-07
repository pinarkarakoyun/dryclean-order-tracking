import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { NewOrderButton } from "@/components/admin/NewOrderButton";
import { OrderCard } from "@/components/admin/OrderCard";
import { initPageLocale } from "@/i18n/page-locale";
import { requireAdmin } from "@/lib/auth";
import {
  getDueState,
  getMissingFields,
  isOpen,
  todayInShop,
} from "@/lib/order-utils";
import { listOrders } from "@/lib/orders";
import { getAllServices } from "@/lib/services";
import type { Order } from "@/types/order";
import type { Service } from "@/types/service";

const RECENT_ORDERS_COUNT = 5;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/admin">) {
  await initPageLocale(params);
  const t = await getTranslations("Dashboard");

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <NewOrderButton />
      </div>
      {/* Orders are read at request time (login cookie + live data), so they stream in. */}
      <Suspense fallback={<p className="text-lg text-muted">{t("loading")}</p>}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  await requireAdmin();
  const t = await getTranslations("Dashboard");
  const [orders, services] = await Promise.all([listOrders(), getAllServices()]);
  const today = todayInShop();

  const attention = orders.filter((order) => getDueState(order, today) !== null);
  const incomplete = orders.filter((order) => getMissingFields(order).length > 0);
  const ready = orders.filter((order) => order.status === "READY_FOR_PICKUP");
  const inProgress = orders.filter((order) => isOpen(order.status));
  const recent = orders.slice(0, RECENT_ORDERS_COUNT);

  const sections: {
    id: string;
    title: string;
    hint?: string;
    orders: Order[];
    showMissing?: boolean;
  }[] = [
    { id: "attention", title: t("attention"), hint: t("attentionHint"), orders: attention },
    {
      id: "incomplete",
      title: t("incomplete"),
      hint: t("incompleteHint"),
      orders: incomplete,
      showMissing: true,
    },
    { id: "ready", title: t("ready"), orders: ready },
    { id: "in-progress", title: t("inProgress"), orders: inProgress },
    { id: "recent", title: t("recent"), orders: recent },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Summary tiles: tap to jump to the list. */}
      <nav className="grid grid-cols-3 gap-3">
        <SummaryTile href="#attention" count={attention.length} label={t("attention")} />
        <SummaryTile href="#in-progress" count={inProgress.length} label={t("inProgress")} />
        <SummaryTile href="#ready" count={ready.length} label={t("ready")} />
      </nav>

      {sections.map((section) => (
        <DashboardSection
          key={section.id}
          id={section.id}
          title={section.title}
          hint={section.hint}
          emptyText={t("empty")}
        >
          {section.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              service={findService(services, order.serviceId)}
              today={today}
              showMissing={section.showMissing}
            />
          ))}
        </DashboardSection>
      ))}
    </div>
  );
}

function findService(services: Service[], serviceId: string | null) {
  return services.find((service) => service.id === serviceId);
}

function SummaryTile({
  href,
  count,
  label,
}: {
  href: string;
  count: number;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface p-3 text-center hover:border-primary"
    >
      <span className="text-3xl font-bold text-primary">{count}</span>
      <span className="text-sm leading-tight font-medium">{label}</span>
    </a>
  );
}

function DashboardSection({
  id,
  title,
  hint,
  emptyText,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  emptyText: string;
  children: ReactNode[];
}) {
  return (
    <section id={id} className="flex scroll-mt-4 flex-col gap-3">
      <div>
        <h2 className="text-2xl font-bold">
          {title} <span className="text-muted">({children.length})</span>
        </h2>
        {hint && <p className="text-muted">{hint}</p>}
      </div>
      {children.length > 0 ? children : <p className="text-muted">{emptyText}</p>}
    </section>
  );
}
