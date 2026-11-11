import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EditCustomerForm } from "@/components/admin/EditCustomerForm";
import { initPageLocale } from "@/i18n/page-locale";
import { requireAdmin } from "@/lib/auth";
import { parseReturnTo } from "@/lib/customer-validation";
import { getCustomer } from "@/lib/customers";

// Loading state and "not found" come from the parent [id] folder (loading.tsx, not-found.tsx).
export default async function EditCustomerPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/customers/[id]/edit">) {
  await initPageLocale(params);
  await requireAdmin();
  const { id } = await params;
  const { from: rawFrom } = await searchParams;

  const customer = await getCustomer(id);
  if (!customer) notFound();

  // Only "order:<uuid>" is kept; anything else returns to the customer page.
  const returnTo = parseReturnTo(typeof rawFrom === "string" ? rawFrom : "");
  const from = returnTo.kind === "order" ? `order:${returnTo.orderId}` : "";
  const cancelHref =
    returnTo.kind === "order" ? `/admin/orders/${returnTo.orderId}` : `/admin/customers/${customer.id}`;

  const t = await getTranslations("EditCustomer");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-lg text-muted">{t("intro")}</p>
      </div>

      <EditCustomerForm
        customerId={customer.id}
        from={from}
        cancelHref={cancelHref}
        initialValues={{
          name: customer.name,
          phone: customer.phone,
          preferenceNote: customer.preferenceNote ?? "",
        }}
      />
    </div>
  );
}
