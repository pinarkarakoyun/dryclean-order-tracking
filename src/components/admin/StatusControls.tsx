import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { changeItemStatusAction } from "@/app/[locale]/admin/(panel)/orders/[id]/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { canQuickChange, getNextItemStatus } from "@/lib/item-status";
import type { ItemStatus } from "@/types/order-model";

type StatusControlsProps = {
  orderId: string;
  itemId: string;
  status: ItemStatus;
};

/**
 * Status buttons for one garment: one big button for the usual next step,
 * and "Cancel" behind "Other options". Plain forms: they work without JavaScript too.
 * Undo and "move back one step" come in roadmap step 4.
 */
export function StatusControls({ orderId, itemId, status }: StatusControlsProps) {
  const t = useTranslations("OrderDetail");
  const tAction = useTranslations("StatusAction");

  const next = getNextItemStatus(status);
  const canCancel = canQuickChange(status, "CANCELLED");
  if (!next && !canCancel) return null;

  return (
    <div className="flex flex-col gap-3">
      {next && (
        <StatusForm orderId={orderId} itemId={itemId} expected={status} target={next}>
          <SubmitButton className="w-full" pendingText="…">
            {tAction(next)}
          </SubmitButton>
        </StatusForm>
      )}

      {canCancel && (
        // <details> opens and closes without any JavaScript.
        <details className="rounded-xl border border-border bg-surface">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold text-primary">
            {t("otherStatus")}
          </summary>
          <div className="flex flex-col gap-3 border-t border-border p-4">
            <p className="text-muted">{t("otherStatusHint")}</p>
            <StatusForm orderId={orderId} itemId={itemId} expected={status} target="CANCELLED">
              <SubmitButton variant="secondary" className="w-full" pendingText="…">
                {tAction("CANCELLED")}
              </SubmitButton>
            </StatusForm>
          </div>
        </details>
      )}
    </div>
  );
}

function StatusForm({
  orderId,
  itemId,
  expected,
  target,
  children,
}: {
  orderId: string;
  itemId: string;
  /** The status shown on screen: the database rejects the change if it moved on meanwhile. */
  expected: ItemStatus;
  target: ItemStatus;
  children: ReactNode;
}) {
  return (
    <form action={changeItemStatusAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="expectedStatus" value={expected} />
      <input type="hidden" name="toStatus" value={target} />
      {children}
    </form>
  );
}
