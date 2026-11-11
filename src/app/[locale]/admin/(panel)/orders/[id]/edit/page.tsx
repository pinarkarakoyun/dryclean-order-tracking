import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EditOrderForm } from "@/components/admin/EditOrderForm";
import { initPageLocale } from "@/i18n/page-locale";
import { requireAdmin } from "@/lib/auth";
import { getOrderDetail } from "@/lib/orders";

// Loading state and "not found" come from the parent [id] folder (loading.tsx, not-found.tsx).
export default async function EditOrderPage({
  params,
}: PageProps<"/[locale]/admin/orders/[id]/edit">) {
  await initPageLocale(params);
  await requireAdmin();
  const { id } = await params;

  const result = await getOrderDetail(id);
  if (!result) notFound();
  const { order } = result;

  const t = await getTranslations("EditOrder");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title", { number: order.orderNumber })}</h1>
        <p className="text-lg text-muted">{t("intro")}</p>
      </div>

      <EditOrderForm
        orderId={order.id}
        initialValues={{
          express: order.expressPercent !== null ? "on" : "",
          estimatedReadyDate: order.estimatedReadyDate ?? "",
          publicDescription: order.publicDescription ?? "",
          internalNote: order.internalNote ?? "",
        }}
      />
    </div>
  );
}
