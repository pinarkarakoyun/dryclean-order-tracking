import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { changeStatusAction } from "@/app/[locale]/admin/(panel)/orders/[id]/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getNextStatus } from "@/lib/order-utils";
import { ORDER_STATUSES, type OrderStatus } from "@/types/order";

type StatusControlsProps = {
  orderId: string;
  status: OrderStatus;
};

/**
 * One big button for the usual next step, plus all other statuses
 * behind "Choose another status" (to fix mistakes or cancel).
 * Plain forms: they work without JavaScript too.
 */
export function StatusControls({ orderId, status }: StatusControlsProps) {
  const t = useTranslations("OrderDetail");
  const tAction = useTranslations("StatusAction");
  const tStatus = useTranslations("Status");

  const next = getNextStatus(status);
  const others = ORDER_STATUSES.filter((value) => value !== status && value !== next);

  return (
    <div className="flex flex-col gap-4">
      {next && (
        <StatusForm orderId={orderId} status={next}>
          <SubmitButton className="w-full" pendingText="…">
            {tAction(next)}
          </SubmitButton>
        </StatusForm>
      )}

      {/* <details> opens and closes without any JavaScript. */}
      <details className="rounded-xl border border-border bg-surface">
        <summary className="flex min-h-14 cursor-pointer items-center px-4 font-semibold text-primary">
          {t("otherStatus")}
        </summary>
        <div className="flex flex-col gap-3 border-t border-border p-4">
          <p className="text-muted">{t("otherStatusHint")}</p>
          {others.map((value) => (
            <StatusForm key={value} orderId={orderId} status={value}>
              <SubmitButton variant="secondary" className="w-full" pendingText="…">
                {t("setStatus", { status: tStatus(value) })}
              </SubmitButton>
            </StatusForm>
          ))}
        </div>
      </details>
    </div>
  );
}

function StatusForm({
  orderId,
  status,
  children,
}: {
  orderId: string;
  status: OrderStatus;
  children: ReactNode;
}) {
  return (
    <form action={changeStatusAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={status} />
      {children}
    </form>
  );
}
