import { getTranslations } from "next-intl/server";
import { ExternalButtonLink } from "@/components/ui/ButtonLink";
import { createQrCodeDataUrl, getTrackingUrl } from "@/lib/tracking";
import type { Order } from "@/types/order";
import { CopyLinkButton } from "./CopyLinkButton";

type TrackingCardProps = Pick<Order, "orderNumber" | "trackingToken" | "customerLanguage">;

/** QR code and link the customer uses to follow the order. */
export async function TrackingCard({
  orderNumber,
  trackingToken,
  customerLanguage,
}: TrackingCardProps) {
  const t = await getTranslations("OrderDetail");
  // The link opens in the customer's language, not the admin's.
  const url = await getTrackingUrl(trackingToken, customerLanguage);
  const qrCode = await createQrCodeDataUrl(url);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">{t("trackingTitle")}</h2>
      <p className="text-muted">{t("trackingText")}</p>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, nothing to optimize */}
        <img
          src={qrCode}
          alt={t("qrAlt", { number: orderNumber })}
          width={224}
          height={224}
          className="size-56"
        />
        <p className="text-center text-lg font-bold">#{orderNumber}</p>
        <p className="w-full text-center text-sm break-all text-muted">{url}</p>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <CopyLinkButton url={url} label={t("copyLink")} copiedLabel={t("copied")} />
          <ExternalButtonLink
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          >
            {t("openTracking")}
          </ExternalButtonLink>
        </div>
      </div>
    </section>
  );
}
