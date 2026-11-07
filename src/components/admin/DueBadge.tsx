import { useTranslations } from "next-intl";
import type { DueState } from "@/lib/order-utils";

/** "Late" (red) or "Ready today" (yellow) label for open orders. */
export function DueBadge({ state }: { state: DueState }) {
  const t = useTranslations("OrderCard");
  if (!state) return null;

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-sm font-bold ${
        state === "overdue" ? "bg-red-700 text-white" : "bg-amber-200 text-amber-950"
      }`}
    >
      {t(state)}
    </span>
  );
}
