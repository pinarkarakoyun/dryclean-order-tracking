import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RenameProductForm } from "@/components/admin/RenameProductForm";
import { initPageLocale } from "@/i18n/page-locale";
import { requireAdmin } from "@/lib/auth";
import { getProduct } from "@/lib/products";

// Loading state and "not found" come from the parent [id] folder (loading.tsx, not-found.tsx).
export default async function EditProductPage({
  params,
}: PageProps<"/[locale]/admin/products/[id]/edit">) {
  await initPageLocale(params);
  await requireAdmin();
  const { id } = await params;

  const product = await getProduct(id);
  if (!product) notFound();

  const t = await getTranslations("Products");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("renameTitle")}</h1>
        <p className="text-lg text-muted">{t("renameIntro")}</p>
      </div>
      <RenameProductForm productId={product.id} name={product.name} />
    </div>
  );
}
