import { getTranslations } from "next-intl/server";
import { ExternalButtonLink } from "@/components/ui/ButtonLink";
import { shop, shopAddressLine } from "@/lib/shop";
import { getTrackingUrl } from "@/lib/tracking";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { ItemStatus } from "@/types/order-model";

type WhatsAppCardProps = {
  /** The order status derived from its items. */
  status: ItemStatus;
  orderNumber: number;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
};

/**
 * Prepared WhatsApp message: "ready" when the order is ready,
 * otherwise the tracking link (useful when there is no printer for the QR code).
 */
export async function WhatsAppCard({
  status,
  orderNumber,
  trackingToken,
  customerName,
  customerPhone,
}: WhatsAppCardProps) {
  // Nothing to tell the customer about finished or cancelled orders.
  if (status === "DELIVERED" || status === "CANCELLED") return null;

  const t = await getTranslations("OrderDetail");
  const tMessage = await getTranslations("WhatsAppMessage");

  const isReady = status === "READY";
  const values = {
    name: customerName.split(/\s+/)[0],
    number: orderNumber,
    shop: shop.fullName,
    address: shopAddressLine(),
    link: await getTrackingUrl(trackingToken),
  };
  const message = isReady ? tMessage("ready", values) : tMessage("tracking", values);

  return (
    <section
      className={`flex flex-col gap-3 rounded-xl p-4 ${
        isReady ? "border-2 border-green-700 bg-green-50" : "border border-border bg-surface"
      }`}
    >
      <h2 className="text-2xl font-bold">{t("whatsappTitle")}</h2>
      <p className="text-muted">{t("whatsappHint")}</p>

      <ExternalButtonLink
        href={buildWhatsAppUrl(customerPhone, message)}
        target="_blank"
        rel="noopener noreferrer"
        variant={isReady ? "success" : "secondary"}
      >
        {isReady ? t("whatsappReady") : t("whatsappTracking")}
      </ExternalButtonLink>

      <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary">
          {t("whatsappPreview")}
        </summary>
        <p className="mt-2 rounded-lg bg-background p-3 whitespace-pre-line">{message}</p>
      </details>
    </section>
  );
}
