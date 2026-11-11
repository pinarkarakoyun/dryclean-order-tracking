import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AddItemForm } from "@/components/admin/AddItemForm";
import { DueBadge } from "@/components/admin/DueBadge";
import { ItemList } from "@/components/admin/ItemList";
import { MissingFieldChips } from "@/components/admin/MissingFieldChips";
import { TrackingCard } from "@/components/admin/TrackingCard";
import { UndoBanner } from "@/components/admin/UndoBanner";
import { WhatsAppCard } from "@/components/admin/WhatsAppCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "@/i18n/navigation";
import { initPageLocale } from "@/i18n/page-locale";
import { requireAdmin } from "@/lib/auth";
import { getUndoTarget } from "@/lib/item-status";
import { calculateOrderTotal, deriveOrderStatus, tagLabel } from "@/lib/order-calc";
import {
  dateOnlyToDate,
  getDueState,
  getMissingFields,
  todayInShop,
} from "@/lib/order-utils";
import { getOrderDetail } from "@/lib/orders";
import { formatPhone } from "@/lib/phone";
import { listActivePriceListItems } from "@/lib/price-list";
import type { ItemStatusEvent, OrderItem } from "@/types/order-model";

type Props = PageProps<"/[locale]/admin/orders/[id]">;

// No generateMetadata here: the page title would need the order id, which is only known
// at request time and would block the whole page. The default site title is used instead.

// The order id is only known at request time; loading.tsx shows a placeholder meanwhile.
export default async function OrderDetailPage({ params, searchParams }: Props) {
  await initPageLocale(params);
  await requireAdmin();
  const { id } = await params;
  // Set by the forms after saving, to show a confirmation ("changed" = item whose status just changed).
  const { notice, changed } = await searchParams;

  const result = await getOrderDetail(id);
  if (!result) notFound();
  const { order, events } = result;

  const t = await getTranslations("OrderDetail");
  const tStatus = await getTranslations("Status");
  const undo = notice === "status" ? undoOffer(order.items, events, changed) : null;
  const tAddItem = await getTranslations("AddItem");
  const format = await getFormatter();
  const priceList = await listActivePriceListItems();
  const summary = deriveOrderStatus(order.items);
  const total = calculateOrderTotal(order.items, order.expressPercent);
  const missing = getMissingFields(order);

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/orders" className="self-start font-semibold text-primary underline">
        ← {t("backToOrders")}
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">#{order.orderNumber}</h1>
          <StatusBadge status={summary.status} />
          {order.expressPercent !== null && (
            <span className="rounded-full bg-red-700 px-3 py-1 font-bold text-white">
              {t("express")}
            </span>
          )}
        </div>
        <p className="text-xl">{order.customer.name}</p>
        {summary.partiallyDelivered && <p className="text-muted">{t("partiallyDelivered")}</p>}
      </header>

      {notice === "created" && (
        <Notice title={t("createdTitle", { number: order.orderNumber })}>
          {t("createdText")}
        </Notice>
      )}
      {notice === "saved" && <Notice title={t("noticeSaved")} />}
      {undo ? (
        <UndoBanner
          orderId={order.id}
          itemId={undo.item.id}
          itemLabel={`${tagLabel(order.orderNumber, undo.item.itemNo)} · ${undo.item.garmentName}`}
          statusLabel={tStatus(undo.item.status)}
          currentStatus={undo.item.status}
          remainingMs={undo.remainingMs}
        />
      ) : (
        notice === "status" && <Notice title={t("noticeStatus")} />
      )}
      {notice === "undone" && <Notice title={t("noticeUndone")} />}
      {notice === "itemAdded" && <Notice title={t("noticeItemAdded")} />}
      {notice === "conflict" && (
        <div role="alert" className="rounded-xl bg-amber-100 p-4 text-lg font-bold text-amber-950">
          {t("noticeConflict")}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t("items")}</h2>
        <ItemList
          orderId={order.id}
          orderNumber={order.orderNumber}
          items={order.items}
          events={events}
        />
      </section>

      <details className="rounded-xl border-2 border-primary bg-surface" open={order.items.length === 0}>
        <summary className="flex min-h-14 cursor-pointer items-center px-4 text-xl font-bold text-primary">
          + {tAddItem("title")}
        </summary>
        <div className="border-t border-border p-4">
          {/* key: a fresh, empty form after each added item (otherwise the last price stays). */}
          <AddItemForm
            key={order.items.length}
            orderId={order.id}
            priceList={priceList.map((entry) => ({
              id: entry.id,
              label: `${entry.name} · ${format.number(entry.priceKurus / 100, "price")}`,
              priceKurus: entry.priceKurus,
            }))}
          />
        </div>
      </details>

      <DetailSection title={t("order")}>
        <DetailRow label={t("total")}>
          {total.kind === "complete" ? (
            <strong>{format.number(total.kurus / 100, "price")}</strong>
          ) : (
            <span className="font-semibold text-amber-800">{t("totalIncomplete")}</span>
          )}
        </DetailRow>
        <DetailRow label={t("express")}>
          {order.expressPercent !== null
            ? t("expressYes", { percent: order.expressPercent })
            : t("expressNo")}
        </DetailRow>
        <DetailRow label={t("estimatedReadyDate")} empty={t("notFilled")}>
          {order.estimatedReadyDate && (
            <span className="flex flex-wrap items-center gap-2">
              {format.dateTime(dateOnlyToDate(order.estimatedReadyDate), "dateLong")}
              <DueBadge state={getDueState(order, todayInShop())} />
            </span>
          )}
        </DetailRow>
        <DetailRow label={t("publicDescription")} empty={t("notFilled")}>
          {order.publicDescription}
        </DetailRow>
        <DetailRow label={t("internalNote")} empty={t("notFilled")}>
          {order.internalNote && (
            <span className="block rounded-lg bg-amber-50 px-3 py-2 whitespace-pre-line">
              {order.internalNote}
            </span>
          )}
        </DetailRow>
        <DetailRow label={t("createdAt")}>
          {format.dateTime(new Date(order.createdAt), "dateTime")}
        </DetailRow>
      </DetailSection>

      {missing.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 p-4">
          <p className="font-semibold">{t("missingTitle")}</p>
          <MissingFieldChips fields={missing} />
        </div>
      )}

      <ButtonLink href={`/admin/orders/${order.id}/edit`} variant="secondary">
        {t("edit")}
      </ButtonLink>

      <WhatsAppCard
        status={summary.status}
        orderNumber={order.orderNumber}
        trackingToken={order.trackingToken}
        customerName={order.customer.name}
        customerPhone={order.customer.phone}
      />

      <TrackingCard orderNumber={order.orderNumber} trackingToken={order.trackingToken} />

      <DetailSection title={t("customer")}>
        <DetailRow label={t("name")}>{order.customer.name}</DetailRow>
        <DetailRow label={t("phone")}>
          <a href={`tel:${order.customer.phone}`} className="font-medium underline">
            {formatPhone(order.customer.phone)}
          </a>
        </DetailRow>
        <DetailRow label={t("preferenceNote")} empty={t("notFilled")}>
          {order.customer.preferenceNote}
        </DetailRow>
      </DetailSection>
    </div>
  );
}

/** "Geri al" is offered for this many milliseconds after a change (CLAUDE.md: 8 seconds). */
const UNDO_WINDOW_MS = 8_000;

/**
 * The just-changed item and the time left to undo it, or null. Based on the event time,
 * so reloading the page later does not bring "Geri al" back. The server re-checks on undo.
 */
function undoOffer(
  items: OrderItem[],
  events: ItemStatusEvent[],
  changedItemId: string | string[] | undefined,
): { item: OrderItem; remainingMs: number } | null {
  const item = items.find((candidate) => candidate.id === changedItemId);
  if (!item) return null;
  const latest = events.filter((event) => event.itemId === item.id).at(-1) ?? null;
  if (getUndoTarget(latest, item.status) === null || !latest) return null;
  const remainingMs = UNDO_WINDOW_MS - (Date.now() - new Date(latest.changedAt).getTime());
  return remainingMs > 0 ? { item, remainingMs } : null;
}

/** Green confirmation box shown after saving. */
function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-1 rounded-xl bg-green-100 p-4 text-green-950">
      <p className="text-lg font-bold">✓ {title}</p>
      {children && <p>{children}</p>}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">{title}</h2>
      <dl className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
        {children}
      </dl>
    </section>
  );
}

/** One label/value row. Shows `empty` (muted) when there is no value. */
function DetailRow({
  label,
  empty,
  children,
}: {
  label: string;
  empty?: string;
  children: ReactNode;
}) {
  const hasValue = children !== null && children !== undefined && children !== false && children !== "";
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-lg">
        {hasValue ? children : <span className="text-muted italic">{empty}</span>}
      </dd>
    </div>
  );
}
