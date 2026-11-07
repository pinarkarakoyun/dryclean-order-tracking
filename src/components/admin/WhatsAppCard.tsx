import { getTranslations } from "next-intl/server";
import { ExternalButtonLink } from "@/components/ui/ButtonLink";
import { shop, shopAddressLine } from "@/lib/shop";
import { getTrackingUrl } from "@/lib/tracking";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Order } from "@/types/order";

type WhatsAppCardProps = {
  order: Pick<
    Order,
    | "orderNumber"
    | "trackingToken"
    | "customerName"
    | "customerPhone"
    | "customerLanguage"
    | "status"
  >;
};

/**
 * Prepared WhatsApp message: "ready for pickup" when the order is ready,
 * otherwise the tracking link (useful when there is no printer for the QR code).
 */
export async function WhatsAppCard({ order }: WhatsAppCardProps) {
  // Nothing to tell the customer about finished or cancelled orders.
  if (order.status === "DELIVERED" || order.status === "CANCELLED") return null;

  const t = await getTranslations("OrderDetail");
  // The message uses the CUSTOMER's language, not the language of the admin panel.
  const tMessage = await getTranslations({
    locale: order.customerLanguage,
    namespace: "WhatsAppMessage",
  });

  const isReady = order.status === "READY_FOR_PICKUP";
  const values = {
    name: order.customerName.split(/\s+/)[0],
    number: order.orderNumber,
    shop: shop.fullName,
    address: shopAddressLine(),
    link: await getTrackingUrl(order.trackingToken, order.customerLanguage),
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
        href={buildWhatsAppUrl(order.customerPhone, message)}
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
