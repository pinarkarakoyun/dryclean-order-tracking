"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { undoItemStatusAction } from "@/app/[locale]/admin/(panel)/orders/[id]/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ItemStatus } from "@/types/order-model";

type UndoBannerProps = {
  orderId: string;
  itemId: string;
  /** e.g. "1048-1 · Gömlek" */
  itemLabel: string;
  /** The new status, already translated. */
  statusLabel: string;
  /** The status now shown: the undo is refused if the item changed again meanwhile. */
  currentStatus: ItemStatus;
  /** Milliseconds left of the 8-second window, computed from the event time on the server. */
  remainingMs: number;
};

/**
 * Shown right after a status change: "1048-1 · Gömlek → Temizlemede  [Geri al]" for 8 seconds.
 * The time limit lives here, in the screen (spec §8); the server only checks that this is the
 * item's latest change. Undo adds a new history event, it never deletes one.
 */
export function UndoBanner({
  orderId,
  itemId,
  itemLabel,
  statusLabel,
  currentStatus,
  remainingMs,
}: UndoBannerProps) {
  const t = useTranslations("OrderDetail");
  const [visible, setVisible] = useState(remainingMs > 0);

  useEffect(() => {
    if (remainingMs <= 0) return;
    const timer = setTimeout(() => setVisible(false), remainingMs);
    return () => clearTimeout(timer);
  }, [remainingMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl bg-green-100 p-4 text-green-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-lg font-bold">
        ✓ {t("undoText", { item: itemLabel, status: statusLabel })}
      </p>
      <form action={undoItemStatusAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="expectedStatus" value={currentStatus} />
        <SubmitButton variant="secondary" pendingText="…">
          {t("undo")}
        </SubmitButton>
      </form>
    </div>
  );
}
