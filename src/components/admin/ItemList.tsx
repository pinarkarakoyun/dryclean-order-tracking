import { useFormatter, useTranslations } from "next-intl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { tagLabel } from "@/lib/order-calc";
import type { ItemStatusEvent, OrderItem } from "@/types/order-model";
import { StatusControls } from "./StatusControls";

type ItemListProps = {
  orderId: string;
  orderNumber: number;
  items: OrderItem[];
  events: ItemStatusEvent[];
};

/** The garments of one order, each with its tag number, status buttons and history. */
export function ItemList({ orderId, orderNumber, items, events }: ItemListProps) {
  const t = useTranslations("OrderDetail");
  const format = useFormatter();

  if (items.length === 0) {
    return <p className="text-lg text-muted">{t("noItems")}</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xl font-bold">
              {tagLabel(orderNumber, item.itemNo)} · {item.garmentName}
            </span>
            <StatusBadge status={item.status} />
          </div>

          <p className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
            <span>
              {item.unitPriceKurus === null
                ? t("noPrice")
                : format.number(item.unitPriceKurus / 100, "price")}
            </span>
            {item.rackLocation && <span>{t("rack", { rack: item.rackLocation })}</span>}
          </p>
          {item.note && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 whitespace-pre-line">{item.note}</p>
          )}

          <StatusControls orderId={orderId} itemId={item.id} status={item.status} />

          <details>
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary">
              {t("history")}
            </summary>
            <div className="mt-3">
              <StatusTimeline
                entries={events
                  .filter((event) => event.itemId === item.id)
                  .map((event) => ({ status: event.toStatus, changedAt: event.changedAt }))}
              />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
