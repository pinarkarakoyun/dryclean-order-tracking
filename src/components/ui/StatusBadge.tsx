import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/types/order";

// Light background + dark text keeps the contrast high for every status.
const statusClasses: Record<OrderStatus, string> = {
  RECEIVED: "bg-sky-100 text-sky-900",
  IN_PROGRESS: "bg-amber-100 text-amber-900",
  READY_FOR_PICKUP: "bg-green-100 text-green-900",
  DELIVERED: "bg-stone-200 text-stone-800",
  CANCELLED: "bg-red-100 text-red-900",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("Status");

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-base font-semibold ${statusClasses[status]}`}
    >
      {t(status)}
    </span>
  );
}
