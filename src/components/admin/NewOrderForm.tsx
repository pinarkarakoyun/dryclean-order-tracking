"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  createOrderAction,
  type NewOrderState,
} from "@/app/[locale]/admin/(panel)/orders/new/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LIMITS } from "@/lib/order-limits";

const initialState: NewOrderState = {
  errors: {},
  values: { name: "", phone: "" },
};

export function NewOrderForm() {
  const t = useTranslations("NewOrder");
  const [state, formAction, isPending] = useActionState(createOrderAction, initialState);
  const { errors, values, existingCustomerName, confirmPhone } = state;

  return (
    // noValidate: the server checks the input and shows clear, translated messages.
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-lg font-semibold">
          {t("name")}
        </label>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          autoFocus
          maxLength={LIMITS.name}
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && <FieldError id="name-error">{t(errors.name)}</FieldError>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className="text-lg font-semibold">
          {t("phone")}
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          maxLength={LIMITS.phone}
          defaultValue={values.phone}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "phone-error phone-hint" : "phone-hint"}
        />
        <p id="phone-hint" className="text-muted">
          {t("phoneHint")}
        </p>
        {errors.phone && <FieldError id="phone-error">{t(errors.phone)}</FieldError>}
      </div>

      {existingCustomerName ? (
        // The phone belongs to a known customer with another name: confirm before opening.
        <div role="alert" className="flex flex-col gap-3 rounded-xl bg-amber-100 p-4 text-amber-950">
          <p className="text-lg font-semibold">
            {t("existingCustomer", { name: existingCustomerName })}
          </p>
          <input type="hidden" name="confirmPhone" value={confirmPhone} />
          <Button type="submit" disabled={isPending}>
            {isPending ? t("submitting") : t("confirmExisting", { name: existingCustomerName })}
          </Button>
        </div>
      ) : (
        <Button type="submit" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      )}
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} role="alert" className="font-medium text-red-800">
      {children}
    </p>
  );
}
