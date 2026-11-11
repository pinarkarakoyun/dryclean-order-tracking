import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { changeItemStatusAction } from "@/app/[locale]/admin/(panel)/orders/[id]/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { canTransition, getNextItemStatus, getPreviousItemStatus } from "@/lib/item-status";
import { ITEM_STATUSES, type ItemStatus } from "@/types/order-model";
import { ConfirmDeliveredForm } from "./ConfirmDeliveredForm";

type StatusControlsProps = {
  orderId: string;
  itemId: string;
  status: ItemStatus;
};

/**
 * Status buttons for one garment. Which buttons appear is decided by canTransition
 * (src/lib/item-status.ts): change the rules there and the buttons follow.
 * - one big button for the usual next step ("Teslim edildi" asks for confirmation)
 * - "Other options": move back one step, skip ahead, cancel, bring back
 * Plain forms: everything except the delivery confirmation works without JavaScript.
 */
export function StatusControls({ orderId, itemId, status }: StatusControlsProps) {
  const t = useTranslations("OrderDetail");
  const tAction = useTranslations("StatusAction");
  const tStatus = useTranslations("Status");
  const fields = { orderId, itemId, expectedStatus: status };

  const next = getNextItemStatus(status);
  const mainStep = next && canTransition(status, next, "normal") ? next : null;
  const previous = getPreviousItemStatus(status);
  const stepBack = previous && canTransition(status, previous, "step_back") ? previous : null;
  const others = ITEM_STATUSES.filter(
    (target) => target !== status && target !== mainStep && canTransition(status, target, "normal"),
  );
  if (!mainStep && !stepBack && others.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {mainStep === "DELIVERED" ? (
        <ConfirmDeliveredForm {...fields} label={tAction("DELIVERED")} />
      ) : (
        mainStep && (
          <StatusForm {...fields} target={mainStep} kind="normal">
            <SubmitButton className="w-full" pendingText="…">
              {tAction(mainStep)}
            </SubmitButton>
          </StatusForm>
        )
      )}

      {(stepBack || others.length > 0) && (
        // <details> opens and closes without any JavaScript.
        <details className="rounded-xl border border-border bg-surface">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold text-primary">
            {t("otherStatus")}
          </summary>
          <div className="flex flex-col gap-3 border-t border-border p-4">
            <p className="text-muted">{t("otherStatusHint")}</p>
            {stepBack && (
              <StatusForm {...fields} target={stepBack} kind="step_back">
                <SubmitButton variant="secondary" className="w-full" pendingText="…">
                  {t("stepBack", { status: tStatus(stepBack) })}
                </SubmitButton>
              </StatusForm>
            )}
            {others.map((target) =>
              target === "DELIVERED" ? (
                <ConfirmDeliveredForm
                  key={target}
                  {...fields}
                  label={t("setStatus", { status: tStatus(target) })}
                  variant="secondary"
                />
              ) : (
                <StatusForm key={target} {...fields} target={target} kind="normal">
                  <SubmitButton variant="secondary" className="w-full" pendingText="…">
                    {t("setStatus", { status: tStatus(target) })}
                  </SubmitButton>
                </StatusForm>
              ),
            )}
          </div>
        </details>
      )}
    </div>
  );
}

function StatusForm({
  orderId,
  itemId,
  expectedStatus,
  target,
  kind,
  children,
}: {
  orderId: string;
  itemId: string;
  /** The status shown on screen: the database rejects the change if it moved on meanwhile. */
  expectedStatus: ItemStatus;
  target: ItemStatus;
  kind: "normal" | "step_back";
  children: ReactNode;
}) {
  return (
    <form action={changeItemStatusAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="expectedStatus" value={expectedStatus} />
      <input type="hidden" name="toStatus" value={target} />
      <input type="hidden" name="kind" value={kind} />
      {children}
    </form>
  );
}
