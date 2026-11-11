import type { Metadata } from "next";
import { Suspense } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Notice } from "@/components/admin/Detail";
import { AddProductForm } from "@/components/admin/AddProductForm";
import { AddQuickPriceForm } from "@/components/admin/AddQuickPriceForm";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { initPageLocale } from "@/i18n/page-locale";
import { requireAdmin } from "@/lib/auth";
import { sortProducts } from "@/lib/product-validation";
import { listProducts } from "@/lib/products";
import { MAX_QUICK_PRICES } from "@/lib/quick-price-validation";
import { listQuickPrices } from "@/lib/quick-prices";
import type { Product } from "@/types/order-model";
import { deleteQuickPriceAction, hideProductAction, restoreProductAction } from "./actions";

const rowButton =
  "min-h-11 rounded-lg px-3 font-semibold text-primary underline underline-offset-4 hover:bg-border/40";

type SearchParams = PageProps<"/[locale]/admin/products">["searchParams"];

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/products">): Promise<Metadata> {
  const locale = await initPageLocale(params);
  const t = await getTranslations({ locale, namespace: "Products" });
  return { title: t("title") };
}

// Products and quick prices: what the item form offers.
export default async function ProductsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/products">) {
  await initPageLocale(params);
  const t = await getTranslations("Products");
  const tDashboard = await getTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-lg text-muted">{t("intro")}</p>
      </div>
      {/* The lists and the notice (?notice=...) are only known at request time. */}
      <Suspense fallback={<p className="text-lg text-muted">{tDashboard("loading")}</p>}>
        <ProductsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductsContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { notice, id } = await searchParams;

  const products = sortProducts(await listProducts());
  const visible = products.filter((product) => product.isActive);
  const hidden = products.filter((product) => !product.isActive);
  const quickPrices = await listQuickPrices();
  // key: a fresh form after every action, so an old error or typed text never stays.
  const formKey = `${products.length}-${quickPrices.length}-${notice}-${id}`;

  const t = await getTranslations("Products");
  const format = await getFormatter();

  return (
    <>
      <ProductNotice notice={notice} id={id} products={products} />

      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{t("productsTitle")}</h2>
          <AddProductForm key={formKey} />

          {visible.length === 0 ? (
            <p className="text-lg text-muted">{t("noProducts")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {visible.map((product) => (
                <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                  <span className="text-lg font-medium">{product.name}</span>
                  <div className="flex items-center gap-1">
                    <ButtonLink href={`/admin/products/${product.id}/edit`} variant="secondary">
                      {t("edit")}
                    </ButtonLink>
                    <form action={hideProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className={rowButton}>
                        {t("hide")}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hidden.length > 0 && (
            <details className="rounded-xl border border-border bg-surface">
              <summary className="flex min-h-14 cursor-pointer items-center px-4 text-lg font-semibold">
                {t("hiddenTitle", { count: hidden.length })}
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {hidden.map((product) => (
                  <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                    <span className="text-lg text-muted">{product.name}</span>
                    <form action={restoreProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className={rowButton}>
                        {t("restore")}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{t("pricesTitle")}</h2>
          {/* The server checks the limit too; hiding the form only keeps the screen honest. */}
          {quickPrices.length < MAX_QUICK_PRICES ? (
            <AddQuickPriceForm key={formKey} />
          ) : (
            <p className="text-lg text-muted">{t("limitReached")}</p>
          )}

          {quickPrices.length === 0 ? (
            <p className="text-lg text-muted">{t("noPrices")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {quickPrices.map((price) => {
                const text = format.number(price.amountKurus / 100, "price");
                return (
                  <li key={price.id} className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="text-lg font-medium">{text}</span>
                    <form action={deleteQuickPriceAction}>
                      <input type="hidden" name="quickPriceId" value={price.id} />
                      <button
                        type="submit"
                        aria-label={t("deletePriceLabel", { price: text })}
                        className={rowButton}
                      >
                        {t("delete")}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

/** The notice after an action. The product name is read from the database, never from the URL. */
async function ProductNotice({
  notice,
  id,
  products,
}: {
  notice: string | string[] | undefined;
  id: string | string[] | undefined;
  products: Product[];
}) {
  const t = await getTranslations("Products");
  if (notice === "productAdded") return <Notice title={t("noticeProductAdded")} />;
  if (notice === "productRenamed") return <Notice title={t("noticeProductRenamed")} />;
  if (notice === "priceAdded") return <Notice title={t("noticePriceAdded")} />;
  if (notice === "priceDeleted") return <Notice title={t("noticePriceDeleted")} />;
  if (notice !== "productHidden" && notice !== "productRestored") return null;

  const product = products.find((candidate) => candidate.id === id);
  if (!product) return null;
  return (
    <Notice
      title={
        notice === "productHidden"
          ? t("noticeProductHidden", { name: product.name })
          : t("noticeProductRestored", { name: product.name })
      }
    />
  );
}
