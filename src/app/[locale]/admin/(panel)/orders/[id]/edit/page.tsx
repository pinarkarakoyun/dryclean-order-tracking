import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EditOrderForm } from "@/components/admin/EditOrderForm";
import { initPageLocale } from "@/i18n/page-locale";
import { requireAdmin } from "@/lib/auth";
import { getOrderWithHistory } from "@/lib/orders";
import { formatPhone } from "@/lib/phone";
import { getAllServices } from "@/lib/services";

// Loading state and "not found" come from the parent [id] folder (loading.tsx, not-found.tsx).
export default async function EditOrderPage({
  params,
}: PageProps<"/[locale]/admin/orders/[id]/edit">) {
  const locale = await initPageLocale(params);
  await requireAdmin();
  const { id } = await params;

  const result = await getOrderWithHistory(id);
  if (!result) notFound();
  const { order } = result;

  const t = await getTranslations("EditOrder");
  // Active services, plus the current one if it was deactivated in the meantime.
  const services = (await getAllServices())
    .filter((service) => service.isActive || service.id === order.serviceId)
    .map((service) => ({ id: service.id, name: service.name[locale] }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title", { number: order.orderNumber })}</h1>
        <p className="text-lg text-muted">{t("intro")}</p>
      </div>

      <EditOrderForm
        orderId={order.id}
        services={services}
        initialValues={{
          name: order.customerName,
          phone: formatPhone(order.customerPhone),
          language: order.customerLanguage,
          serviceId: order.serviceId ?? "",
          clothingType: order.clothingType ?? "",
          publicDescription: order.publicDescription ?? "",
          internalNote: order.internalNote ?? "",
          price: order.priceCents === null ? "" : formatPriceInput(order.priceCents, locale),
          estimatedReadyDate: order.estimatedReadyDate ?? "",
        }}
      />
    </div>
  );
}

/** 1550 -> "15,50" (or "15.50" in English), the way people type prices. */
function formatPriceInput(cents: number, locale: string): string {
  const euros = (cents / 100).toFixed(2);
  return locale === "en" ? euros : euros.replace(".", ",");
}
