"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  addItemAction,
  type AddItemErrorKey,
  type AddItemState,
} from "@/app/[locale]/admin/(panel)/orders/[id]/actions";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LIMITS, QUICK_PRICES_KURUS } from "@/lib/order-limits";

type AddItemFormProps = {
  orderId: string;
  /** Active price list items: label with the formatted price, and the price for the price box. */
  priceList: { id: string; label: string; priceKurus: number }[];
};

/** 12000 -> "120", 15050 -> "150,50": the way people type prices. */
function toPriceInput(kurus: number): string {
  return kurus % 100 === 0 ? String(kurus / 100) : (kurus / 100).toFixed(2).replace(".", ",");
}

const initialState: AddItemState = {
  errors: {},
  values: { priceListItemId: "", customName: "", price: "", rack: "", note: "" },
};

/** Adds one garment: pick it from the price list or type its name; the price is always editable. */
export function AddItemForm({ orderId, priceList }: AddItemFormProps) {
  const t = useTranslations("AddItem");
  const [state, formAction] = useActionState(addItemAction, initialState);
  const { errors, values } = state;
  // Controlled fields: picking a list item fills the price and clears a typed name,
  // typing a name clears the list choice ("or", never both). The price stays editable.
  const [listItemId, setListItemId] = useState(values.priceListItemId);
  const [customName, setCustomName] = useState(values.customName);
  const [price, setPrice] = useState(values.price);
  const errorText = (key: AddItemErrorKey | undefined) => (key ? t(key) : undefined);

  const onPickListItem = (id: string) => {
    const entry = priceList.find((candidate) => candidate.id === id);
    setListItemId(id);
    if (entry) setCustomName("");
    setPrice(entry ? toPriceInput(entry.priceKurus) : "");
  };

  const onTypeName = (name: string) => {
    setCustomName(name);
    if (name && listItemId) {
      setListItemId("");
      setPrice("");
    }
  };

  return (
    // noValidate: the server checks the input and shows clear, translated messages.
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="orderId" value={orderId} />

      <Field id="priceListItemId" label={t("fromList")} error={errorText(errors.item)}>
        <select
          id="priceListItemId"
          name="priceListItemId"
          value={listItemId}
          onChange={(event) => onPickListItem(event.target.value)}
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
          value={customName}
          onChange={(event) => onTypeName(event.target.value)}
        />
      </Field>

      <Field id="price" label={t("price")} hint={t("priceHint")} error={errorText(errors.price)}>
        <Input
          id="price"
          name="price"
          inputMode="decimal"
          autoComplete="off"
          maxLength={10}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="max-w-48"
        />
      </Field>

      <fieldset className="-mt-2 flex flex-col gap-2">
        <legend className="mb-2 font-semibold">{t("quickPrices")}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_PRICES_KURUS.map((kurus) => {
            const text = toPriceInput(kurus);
            return (
              <button
                key={kurus}
                type="button"
                onClick={() => setPrice(text)}
                aria-pressed={price === text}
                className="min-h-14 rounded-xl border-2 border-border bg-surface text-lg font-semibold hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {text} ₺
              </button>
            );
          })}
        </div>
      </fieldset>

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
