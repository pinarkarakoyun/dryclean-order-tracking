"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { changeItemStatusAction } from "@/app/[locale]/admin/(panel)/orders/[id]/actions";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ItemStatus } from "@/types/order-model";

type ConfirmDeliveredFormProps = {
  orderId: string;
  itemId: string;
  expectedStatus: ItemStatus;
  /** Text of the first button, e.g. "Teslim edildi". */
  label: string;
  variant?: ButtonVariant;
};

/**
 * "Teslim edildi" needs a second, explicit tap: the first button opens a confirmation
 * in the same place (no small browser dialog), so a slip of the finger cannot hand over a garment.
 */
export function ConfirmDeliveredForm({
  orderId,
  itemId,
  expectedStatus,
  label,
  variant = "primary",
}: ConfirmDeliveredFormProps) {
  const t = useTranslations("OrderDetail");
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button variant={variant} className="w-full" onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form
      action={changeItemStatusAction}
      className="flex flex-col gap-3 rounded-xl border-2 border-green-700 bg-green-50 p-4"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="expectedStatus" value={expectedStatus} />
      <input type="hidden" name="toStatus" value="DELIVERED" />
      <input type="hidden" name="kind" value="normal" />
      <p role="alert" className="text-lg font-semibold">
        {t("confirmDeliveredQuestion")}
      </p>
      <SubmitButton variant="success" className="w-full" pendingText="…">
        {t("confirmDelivered")}
      </SubmitButton>
      <Button variant="secondary" className="w-full" onClick={() => setAsking(false)}>
        {t("confirmCancel")}
      </Button>
    </form>
  );
}
