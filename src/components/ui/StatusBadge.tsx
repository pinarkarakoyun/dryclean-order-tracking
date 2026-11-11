import { useTranslations } from "next-intl";
import type { ItemStatus } from "@/types/order-model";

// Light background + dark text keeps the contrast high for every status.
const statusClasses: Record<ItemStatus, string> = {
  RECEIVED: "bg-sky-100 text-sky-900",
  CLEANING: "bg-amber-100 text-amber-900",
  IRONING: "bg-orange-100 text-orange-900",
  READY: "bg-green-100 text-green-900",
  DELIVERED: "bg-stone-200 text-stone-800",
  CANCELLED: "bg-red-100 text-red-900",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  const t = useTranslations("Status");

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-base font-semibold ${statusClasses[status]}`}
    >
      {t(status)}
    </span>
  );
}
