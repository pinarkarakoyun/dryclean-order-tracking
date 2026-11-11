"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  addQuickPriceAction,
  type QuickPriceFormState,
} from "@/app/[locale]/admin/(panel)/products/actions";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: QuickPriceFormState = { error: null, value: "" };

/** Amount box and one button. The page gives it a new key after each action, so it empties. */
export function AddQuickPriceForm() {
  const t = useTranslations("Products");
  const [state, formAction] = useActionState(addQuickPriceAction, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-2">
      <label htmlFor="amount" className="text-lg font-semibold">
        {t("amount")}
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          maxLength={10}
          defaultValue={state.value}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "amount-error" : undefined}
          className="max-w-40"
        />
        <SubmitButton pendingText={t("adding")}>{t("add")}</SubmitButton>
      </div>
      {state.error && (
        <p id="amount-error" role="alert" className="font-medium text-red-800">
          {t(state.error)}
        </p>
      )}
    </form>
  );
}
