"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { changeOrderStatus } from "@/lib/orders";
import { readText } from "@/lib/order-validation";
import { ORDER_STATUSES } from "@/types/order";

/** Called by the status buttons on the order detail page. */
export async function changeStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const orderId = readText(formData, "orderId");
  const rawStatus = readText(formData, "status");
  // Only the five known statuses are accepted.
  const status = ORDER_STATUSES.find((value) => value === rawStatus);
  const locale = await getLocale();

  const order = status ? await changeOrderStatus(orderId, status) : null;
  if (!order) {
    redirect({ href: "/admin/orders", locale });
    return;
  }

  // Back to the detail page (fresh data), with a confirmation message.
  redirect({
    href: { pathname: `/admin/orders/${order.id}`, query: { notice: "status" } },
    locale,
  });
}
