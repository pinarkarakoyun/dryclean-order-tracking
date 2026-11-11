"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addProductAction, type ProductFormState } from "@/app/[locale]/admin/(panel)/products/actions";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LIMITS } from "@/lib/order-limits";

const initialState: ProductFormState = { error: null, value: "" };

/** One box and one button. The page gives it a new key after each add, so the box empties. */
export function AddProductForm() {
  const t = useTranslations("Products");
  const [state, formAction] = useActionState(addProductAction, initialState);

  return (
    // noValidate: the server checks the input and shows clear, translated messages.
    <form action={formAction} noValidate className="flex flex-col gap-2">
      <label htmlFor="newProduct" className="text-lg font-semibold">
        {t("newProduct")}
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id="newProduct"
          name="name"
          autoComplete="off"
          maxLength={LIMITS.garmentName}
          defaultValue={state.value}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "newProduct-error" : undefined}
          className="min-w-0 flex-1"
        />
        <SubmitButton pendingText={t("adding")}>{t("add")}</SubmitButton>
      </div>
      {state.error && (
        <p id="newProduct-error" role="alert" className="font-medium text-red-800">
          {t(state.error)}
        </p>
      )}
    </form>
  );
}
