import { useFormatter, useLocale, useTranslations } from "next-intl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "@/i18n/navigation";
import {
  dateOnlyToDate,
  getDueState,
  getMissingFields,
} from "@/lib/order-utils";
import type { Order } from "@/types/order";
import type { Service } from "@/types/service";
import { DueBadge } from "./DueBadge";
import { MissingFieldChips } from "./MissingFieldChips";

type OrderCardProps = {
  order: Order;
  service: Service | undefined;
  /** Today's date in the shop ("YYYY-MM-DD"), to show late orders. */
  today: string;
  showMissing?: boolean;
};

/** Order summary that opens the order detail page. */
export function OrderCard({
  order,
  service,
  today,
  showMissing = false,
}: OrderCardProps) {
  const t = useTranslations("OrderCard");
  const format = useFormatter();
  const locale = useLocale();

  const missing = showMissing ? getMissingFields(order) : [];

  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 hover:border-primary focus-visible:outline-4 focus-visible:outline-primary"
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg font-bold">
          #{order.orderNumber} · {order.customerName}
        </span>
        <StatusBadge status={order.status} />
      </span>

      <span className="text-muted">
        {service ? service.name[locale] : t("noService")}
        {order.clothingType && ` · ${order.clothingType}`}
      </span>

      <span className="flex flex-wrap items-center gap-2">
        <span>
          {order.estimatedReadyDate
            ? t("readyBy", {
                date: format.dateTime(
                  dateOnlyToDate(order.estimatedReadyDate),
                  "dateLong",
                ),
              })
            : t("noDate")}
        </span>
        <DueBadge state={getDueState(order, today)} />
      </span>

      {missing.length > 0 && (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{t("missing")}</span>
          <MissingFieldChips fields={missing} />
        </span>
      )}
    </Link>
  );
}
