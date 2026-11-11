import { useFormatter, useTranslations } from "next-intl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "@/i18n/navigation";
import { deriveOrderStatus } from "@/lib/order-calc";
import { dateOnlyToDate, getDueState, getMissingFields } from "@/lib/order-utils";
import type { OrderWithDetails } from "@/types/order-model";
import { DueBadge } from "./DueBadge";
import { MissingFieldChips } from "./MissingFieldChips";

type OrderCardProps = {
  order: OrderWithDetails;
  /** Today's date in the shop ("YYYY-MM-DD"), to show late orders. */
  today: string;
  showMissing?: boolean;
};

/** Order summary that opens the order detail page. */
export function OrderCard({ order, today, showMissing = false }: OrderCardProps) {
  const t = useTranslations("OrderCard");
  const format = useFormatter();

  const { status } = deriveOrderStatus(order.items);
  const activeItems = order.items.filter((item) => item.status !== "CANCELLED");
  const missing = showMissing ? getMissingFields(order) : [];

  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 hover:border-primary focus-visible:outline-4 focus-visible:outline-primary"
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg font-bold">
          #{order.orderNumber} · {order.customer.name}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {order.expressPercent !== null && (
            <span className="rounded-full bg-red-700 px-2 py-0.5 text-sm font-bold text-white">
              {t("express")}
            </span>
          )}
          <StatusBadge status={status} />
        </span>
      </span>

      <span className="text-muted">
        {t("itemCount", { count: activeItems.length })}
        {activeItems.length > 0 && ` · ${activeItems.map((item) => item.garmentName).join(", ")}`}
      </span>

      <span className="flex flex-wrap items-center gap-2">
        <span>
          {order.estimatedReadyDate
            ? t("readyBy", {
                date: format.dateTime(dateOnlyToDate(order.estimatedReadyDate), "dateLong"),
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
