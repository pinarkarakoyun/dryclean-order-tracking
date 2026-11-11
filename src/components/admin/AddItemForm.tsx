"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  addItemAction,
  type AddItemErrorKey,
  type AddItemState,
} from "@/app/[locale]/admin/(panel)/orders/[id]/actions";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LIMITS } from "@/lib/order-limits";

type AddItemFormProps = {
  orderId: string;
  /** Active price list items, with the price already formatted for display. */
  priceList: { id: string; label: string }[];
};

const initialState: AddItemState = {
  errors: {},
  values: { priceListItemId: "", customName: "", price: "", rack: "", note: "" },
};

/** Adds one garment: pick it from the price list, or type its name (and price) by hand. */
export function AddItemForm({ orderId, priceList }: AddItemFormProps) {
  const t = useTranslations("AddItem");
  const [state, formAction] = useActionState(addItemAction, initialState);
  const { errors, values } = state;
  const errorText = (key: AddItemErrorKey | undefined) => (key ? t(key) : undefined);

  return (
    // noValidate: the server checks the input and shows clear, translated messages.
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="orderId" value={orderId} />

      <Field id="priceListItemId" label={t("fromList")} error={errorText(errors.item)}>
        <select
          id="priceListItemId"
          name="priceListItemId"
          defaultValue={values.priceListItemId}
          className="min-h-14 w-full rounded-xl border-2 border-border bg-surface px-3 text-lg"
        >
          <option value="">{t("fromListNone")}</option>
          {priceList.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="customName" label={t("customName")} hint={t("customNameHint")}>
        <Input
          id="customName"
          name="customName"
          autoComplete="off"
          maxLength={LIMITS.garmentName}
          defaultValue={values.customName}
        />
      </Field>

      <Field id="price" label={t("price")} hint={t("priceHint")} error={errorText(errors.price)}>
        <Input
          id="price"
          name="price"
          inputMode="decimal"
          autoComplete="off"
          maxLength={10}
          defaultValue={values.price}
          className="max-w-48"
        />
      </Field>

      <Field id="rack" label={t("rack")} error={errorText(errors.rack)}>
        <Input
          id="rack"
          name="rack"
          autoComplete="off"
          maxLength={LIMITS.rackLocation}
          defaultValue={values.rack}
          className="max-w-48"
        />
      </Field>

      <Field id="note" label={t("note")} hint={t("noteHint")} error={errorText(errors.note)}>
        <Input
          id="note"
          name="note"
          autoComplete="off"
          maxLength={LIMITS.itemNote}
          defaultValue={values.note}
        />
      </Field>

      <SubmitButton pendingText={t("submitting")}>{t("submit")}</SubmitButton>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lg font-semibold">
        {label}
      </label>
      {hint && <p className="-mt-1 text-muted">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="font-medium text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
